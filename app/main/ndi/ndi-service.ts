import { NDI_OUTPUT_HEIGHT, NDI_OUTPUT_WIDTH } from '@core/ndi';
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

export class NdiService {
  private module: NdiNativeModule | null = null;
  private runtimeLoaded = false;
  private runtimePath: string | null = null;
  private outputState: NdiOutputState = { audience: false };
  private outputConfigs: NdiOutputConfigMap;
  private onOutputConfigsChanged: (configs: NdiOutputConfigMap) => void;
  private moduleLoader: () => NdiNativeModule;
  private activeSender: NdiActiveSenderDiagnostics | null = null;
  private sourceStatus: NdiSourceStatus = 'idle';
  private lastError: string | null = null;
  private lastFrame: Uint8Array | null = null;
  private lastFrameWidth = 0;
  private lastFrameHeight = 0;
  private lastFrameReceivedAt = 0;
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
      this.stopHeartbeat();
      this.sourceStatus = 'idle';
      this.lastFrame = null;
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

  receiveFrame(rgba: Uint8Array, width: number, height: number): void {
    if (this.destroyed) return;

    if (!this.lastFrame || this.lastFrame.length !== rgba.length) {
      this.lastFrame = new Uint8Array(rgba.length);
    }
    this.lastFrame.set(rgba);
    this.lastFrameWidth = width;
    this.lastFrameHeight = height;
    this.lastFrameReceivedAt = Date.now();

    for (const name of Object.keys(this.outputState) as NdiOutputName[]) {
      if (!this.outputState[name]) continue;
      this.sendFrame(name, rgba, width, height);
    }
  }

  setSourceStatus(status: NdiSourceStatus): void {
    if (this.sourceStatus === status) return;
    this.sourceStatus = status;
    this.emitDiagnosticsChange();
  }

  getDiagnostics(): NdiDiagnostics {
    return {
      outputState: this.getOutputState(),
      outputConfig: { ...this.outputConfigs.audience },
      runtimeLoaded: this.runtimeLoaded,
      runtimePath: this.runtimePath,
      activeSender: this.activeSender ? { ...this.activeSender } : null,
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
      // destroySender internally sends a black frame, flushes, and waits
      // for network delivery before tearing down the NDI sender.
      this.module?.destroySender();
    } catch (error) {
      console.error('[NdiService] Error during destroy:', error);
    }

    this.activeSender = null;
    this.lastFrame = null;
    this.module = null;
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
      this.activeSender = {
        senderName: config.senderName,
        width,
        height,
        withAlpha: config.withAlpha,
      };
      this.lastError = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[NdiService] Failed to initialize sender:', message);
      this.lastError = message;
      this.activeSender = null;
    }
  }

  private destroySenderForOutput(name: NdiOutputName): void {
    if (!this.module || !this.activeSender) return;

    try {
      this.module.destroySender(this.outputConfigs[name].senderName);
    } catch (error) {
      console.error('[NdiService] Error destroying sender:', error);
    }

    this.activeSender = null;
  }

  private sendFrame(name: NdiOutputName, rgba: Uint8Array, width: number, height: number): void {
    if (!this.module || !this.activeSender) return;

    const config = this.outputConfigs[name];
    if (this.activeSender.senderName !== config.senderName) return;

    try {
      this.module.sendRgbaFrame(config.senderName, rgba, width, height);
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

      for (const name of Object.keys(this.outputState) as NdiOutputName[]) {
        if (!this.outputState[name]) continue;
        if (now - this.lastFrameReceivedAt <= HEARTBEAT_STALL_THRESHOLD_MS) continue;
        if (this.lastFrame) {
          this.sendFrame(name, this.lastFrame, this.lastFrameWidth, this.lastFrameHeight);
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
