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
const BYTES_PER_PIXEL = 4;
const MAX_FRAME_BYTES = NDI_OUTPUT_WIDTH * NDI_OUTPUT_HEIGHT * BYTES_PER_PIXEL;

type StateChangeCallback = (state: NdiOutputState) => void;
type DiagnosticsChangeCallback = (diagnostics: NdiDiagnostics) => void;

interface NdiServiceOptions {
  outputConfigs: NdiOutputConfigMap;
  onOutputConfigsChanged: (configs: NdiOutputConfigMap) => void;
  moduleLoader?: () => NdiNativeModule;
}

interface SenderState {
  diagnostics: NdiActiveSenderDiagnostics;
  outputName: NdiOutputName;
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
      this.rebuildActiveSenders();
      this.startHeartbeat();
    } else {
      this.destroySenderForOutput(name);
      this.rebuildActiveSenders();
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
      this.rebuildActiveSenders();
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
    if (!this.isValidFramePayload(rgba, width, height)) {
      this.lastError = `Rejected invalid NDI frame for ${name}`;
      this.emitDiagnosticsChange();
      return;
    }

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
    const senderName = this.resolveSenderName(name);
    const width = NDI_OUTPUT_WIDTH;
    const height = NDI_OUTPUT_HEIGHT;

    try {
      this.module!.initializeSender({
        senderName,
        width,
        height,
        withAlpha: config.withAlpha,
      });
      this.senders.set(name, {
        diagnostics: {
          senderName,
          width,
          height,
          withAlpha: config.withAlpha,
        },
        outputName: name,
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

  private rebuildActiveSenders(): void {
    const enabledOutputs = NDI_OUTPUT_ORDER.filter((name) => this.outputState[name]);
    const previousFrames = new Map(this.senders);

    for (const name of [...this.senders.keys()]) {
      this.destroySenderForOutput(name);
    }

    for (const name of enabledOutputs) {
      this.ensureSender(name);
      const restored = this.senders.get(name);
      const previous = previousFrames.get(name);
      if (!restored || !previous) continue;
      restored.lastFrame = previous.lastFrame ? new Uint8Array(previous.lastFrame) : null;
      restored.lastFrameWidth = previous.lastFrameWidth;
      restored.lastFrameHeight = previous.lastFrameHeight;
      restored.lastFrameReceivedAt = previous.lastFrameReceivedAt;
    }
  }

  private resolveSenderName(name: NdiOutputName): string {
    const requestedName = this.outputConfigs[name].senderName.trim();
    let duplicateCount = 0;
    for (const outputName of NDI_OUTPUT_ORDER) {
      if (!this.outputState[outputName]) continue;
      const candidate = this.outputConfigs[outputName].senderName.trim();
      if (candidate !== requestedName) continue;
      duplicateCount += 1;
      if (outputName === name) {
        break;
      }
    }

    if (duplicateCount <= 1) {
      return requestedName;
    }

    const suffix = name === 'audience' ? 'Audience' : 'Stage';
    return `${requestedName} (${suffix})`;
  }

  private isValidFramePayload(rgba: Uint8Array, width: number, height: number): boolean {
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      return false;
    }
    if (width !== NDI_OUTPUT_WIDTH || height !== NDI_OUTPUT_HEIGHT) {
      return false;
    }

    const expectedLength = width * height * BYTES_PER_PIXEL;
    if (expectedLength <= 0 || expectedLength > MAX_FRAME_BYTES) {
      return false;
    }

    return rgba.byteLength === expectedLength;
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
