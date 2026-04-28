import { NDI_OUTPUT_HEIGHT, NDI_OUTPUT_WIDTH, NDI_OUTPUT_ORDER } from '@core/ndi';
import type {
  NdiActiveSenderDiagnostics,
  NdiDiagnostics,
  NdiOutputConfig,
  NdiOutputConfigMap,
  NdiOutputName,
  NdiOutputState,
  NdiSourceStatus,
} from '@core/types';
import { defaultNdiModuleLoader, type NdiNativeModule } from './ndi-native-module';

const HEARTBEAT_INTERVAL_MS = Math.round(1000 / 30);
const HEARTBEAT_STALL_THRESHOLD_MS = HEARTBEAT_INTERVAL_MS * 2;

type StateChangeCallback = (state: NdiOutputState) => void;
type DiagnosticsChangeCallback = (diagnostics: NdiDiagnostics) => void;

interface NdiServiceOptions {
  outputConfigs: NdiOutputConfigMap;
  onOutputConfigsChanged: (configs: NdiOutputConfigMap) => void;
  moduleLoader?: () => NdiNativeModule;
}

interface SenderState {
  diagnostics: NdiActiveSenderDiagnostics;
  lastFrame: Uint8Array | null;
  lastFrameWidth: number;
  lastFrameHeight: number;
  lastFrameReceivedAt: number;
}

export class NdiService {
  private module: NdiNativeModule | null = null;
  private runtimeLoaded = false;
  private runtimePath: string | null = null;
  private outputState: NdiOutputState = { audience: false, stage: false };
  private outputConfigs: NdiOutputConfigMap;
  private onOutputConfigsChanged: (configs: NdiOutputConfigMap) => void;
  private moduleLoader: () => NdiNativeModule;
  // One sender per NdiOutputName so Preview and Stage can run concurrently.
  private senders: Map<NdiOutputName, SenderState> = new Map();
  private sourceStatus: NdiSourceStatus = 'idle';
  private lastError: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  private stateChangeListeners: StateChangeCallback[] = [];
  private diagnosticsChangeListeners: DiagnosticsChangeCallback[] = [];

  constructor(options: NdiServiceOptions) {
    this.outputConfigs = options.outputConfigs;
    this.onOutputConfigsChanged = options.onOutputConfigsChanged;
    this.moduleLoader = options.moduleLoader ?? defaultNdiModuleLoader;
  }

  getOutputState(): NdiOutputState {
    return { ...this.outputState };
  }

  getOutputConfigs(): NdiOutputConfigMap {
    return { ...this.outputConfigs };
  }

  setOutputEnabled(name: NdiOutputName, enabled: boolean): NdiOutputState {
    this.outputState[name] = enabled;

    if (enabled) {
      this.ensureSender(name);
      this.startHeartbeat();
    } else {
      this.destroySenderForOutput(name);
      if (this.allOutputsDisabled()) {
        this.stopHeartbeat();
        this.sourceStatus = 'idle';
      }
    }

    this.emitStateChange();
    this.emitDiagnosticsChange();
    return this.getOutputState();
  }

  updateOutputConfig(name: NdiOutputName, config: Partial<NdiOutputConfig>): NdiOutputConfigMap {
    const current = this.outputConfigs[name];
    const updated = { ...current, ...config };
    this.outputConfigs = { ...this.outputConfigs, [name]: updated };
    this.onOutputConfigsChanged(this.outputConfigs);

    if (this.outputState[name]) {
      this.destroySenderForOutput(name);
      this.ensureSender(name);
    }

    this.emitDiagnosticsChange();
    return this.getOutputConfigs();
  }

  // Per-sender frame ingest. Each NdiFrameCapture instance in the renderer
  // tags its frames with the output name; we route the frame only to that
  // sender so Preview and Stage can show different content concurrently.
  receiveFrame(name: NdiOutputName, rgba: Uint8Array, width: number, height: number): void {
    if (this.destroyed) return;
    if (!this.outputState[name]) return;

    const sender = this.senders.get(name);
    if (!sender) return;

    if (!sender.lastFrame || sender.lastFrame.length !== rgba.length) {
      sender.lastFrame = new Uint8Array(rgba.length);
    }
    sender.lastFrame.set(rgba);
    sender.lastFrameWidth = width;
    sender.lastFrameHeight = height;
    sender.lastFrameReceivedAt = Date.now();

    this.sendFrame(name, rgba, width, height);
  }

  setSourceStatus(status: NdiSourceStatus): void {
    if (this.sourceStatus === status) return;
    this.sourceStatus = status;
    this.emitDiagnosticsChange();
  }

  getDiagnostics(): NdiDiagnostics {
    // Diagnostics report on the audience sender as the primary surface, since
    // most consumers (status bar, output settings) are scoped to that output.
    // Per-sender diagnostics can land alongside the per-sender settings UI.
    const audienceSender = this.senders.get('audience');
    return {
      outputState: this.getOutputState(),
      outputConfig: { ...this.outputConfigs.audience },
      runtimeLoaded: this.runtimeLoaded,
      runtimePath: this.runtimePath,
      activeSender: audienceSender ? { ...audienceSender.diagnostics } : null,
      sourceStatus: this.sourceStatus,
      lastError: this.lastError,
    };
  }

  onOutputStateChanged(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.push(callback);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((listener) => listener !== callback);
    };
  }

  onDiagnosticsChanged(callback: DiagnosticsChangeCallback): () => void {
    this.diagnosticsChangeListeners.push(callback);
    return () => {
      this.diagnosticsChangeListeners = this.diagnosticsChangeListeners.filter((listener) => listener !== callback);
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopHeartbeat();

    try {
      // destroySender() with no name tears down everything cleanly.
      this.module?.destroySender();
    } catch (error) {
      console.error('[NdiService] Error during destroy:', error);
    }

    this.senders.clear();
    this.module = null;
  }

  private allOutputsDisabled(): boolean {
    for (const name of NDI_OUTPUT_ORDER) {
      if (this.outputState[name]) return false;
    }
    return true;
  }

  private loadModuleIfNeeded(): boolean {
    if (this.module) return true;

    try {
      this.module = this.moduleLoader();
      const info = this.module.getRuntimeInfo?.();
      this.runtimeLoaded = info?.loaded ?? true;
      this.runtimePath = info?.path ?? null;
      this.lastError = null;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[NdiService] Failed to load native module:', message);
      this.lastError = message;
      this.runtimeLoaded = false;
      return false;
    }
  }

  private ensureSender(name: NdiOutputName): void {
    if (!this.loadModuleIfNeeded()) return;
    if (this.senders.has(name)) return;

    const config = this.outputConfigs[name];
    const width = NDI_OUTPUT_WIDTH;
    const height = NDI_OUTPUT_HEIGHT;

    try {
      this.module!.initializeSender({
        senderName: config.senderName,
        width,
        height,
        withAlpha: config.withAlpha,
      });
      this.senders.set(name, {
        diagnostics: {
          senderName: config.senderName,
          width,
          height,
          withAlpha: config.withAlpha,
        },
        lastFrame: null,
        lastFrameWidth: 0,
        lastFrameHeight: 0,
        lastFrameReceivedAt: 0,
      });
      this.lastError = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[NdiService] Failed to initialize sender:', message);
      this.lastError = message;
    }
  }

  private destroySenderForOutput(name: NdiOutputName): void {
    if (!this.module) return;
    const sender = this.senders.get(name);
    if (!sender) return;

    try {
      this.module.destroySender(sender.diagnostics.senderName);
    } catch (error) {
      console.error('[NdiService] Error destroying sender:', error);
    }

    this.senders.delete(name);
  }

  private sendFrame(name: NdiOutputName, rgba: Uint8Array, width: number, height: number): void {
    if (!this.module) return;
    const sender = this.senders.get(name);
    if (!sender) return;

    try {
      this.module.sendRgbaFrame(sender.diagnostics.senderName, rgba, width, height);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[NdiService] Frame send failed:', message);
      this.lastError = message;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.destroyed) return;
      const now = Date.now();

      for (const [name, sender] of this.senders) {
        if (!this.outputState[name]) continue;
        if (now - sender.lastFrameReceivedAt <= HEARTBEAT_STALL_THRESHOLD_MS) continue;
        if (sender.lastFrame) {
          this.sendFrame(name, sender.lastFrame, sender.lastFrameWidth, sender.lastFrameHeight);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private emitStateChange(): void {
    const state = this.getOutputState();
    for (const listener of this.stateChangeListeners) {
      listener(state);
    }
  }

  private emitDiagnosticsChange(): void {
    const diagnostics = this.getDiagnostics();
    for (const listener of this.diagnosticsChangeListeners) {
      listener(diagnostics);
    }
  }
}
