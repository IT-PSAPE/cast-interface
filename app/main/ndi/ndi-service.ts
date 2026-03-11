import type { NdiOutputName, NdiOutputState, SlideFrame } from '@core/types';
import {
  defaultNdiModuleLoader,
  NDI_OUTPUT_DEFINITIONS,
  NDI_OUTPUT_ORDER,
  type NdiNativeModule
} from './ndi-native-module';

const BLACK_FRAME_CACHE_LIMIT = 8;
const HEARTBEAT_FPS = 30;
const HEARTBEAT_INTERVAL_MS = Math.round(1000 / HEARTBEAT_FPS);
const NO_INPUT_HEARTBEAT_THRESHOLD_MS = 100;
const DEBUG_LOG_INTERVAL_MS = 5000;
const DEBUG_ENABLED_BY_DEFAULT = process.env.CAST_NDI_DEBUG === '1';

interface SenderEntry {
  output: NdiOutputName;
  senderName: string;
  width: number;
  height: number;
  withAlpha: boolean;
  lastFrameSentAt: number;
  lastFrameRgba: Uint8Array | null;
}

interface NdiDebugCounters {
  ingressFrames: number;
  rejectedFrames: number;
  senderErrors: number;
  heartbeatBlackFrames: number;
  sendsByOutput: Record<NdiOutputName, number>;
}

export interface NdiServiceOptions {
  loadNativeModule?: () => NdiNativeModule;
  scheduleTask?: (task: () => void) => void;
  now?: () => number;
  setIntervalFn?: (task: () => void, delayMs: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (intervalId: ReturnType<typeof setInterval>) => void;
  debugEnabled?: boolean;
}

type OutputStateListener = (state: NdiOutputState) => void;

function createInitialOutputState(): NdiOutputState {
  return { audience: false };
}

function outputStatesEqual(left: NdiOutputState, right: NdiOutputState): boolean {
  return left.audience === right.audience;
}

function frameHasValidSize(frame: SlideFrame): boolean {
  if (!Number.isFinite(frame.width) || !Number.isFinite(frame.height)) return false;
  if (frame.width <= 0 || frame.height <= 0) return false;
  const requiredBytes = frame.width * frame.height * 4;
  return frame.rgba.byteLength >= requiredBytes;
}

function createDebugCounters(): NdiDebugCounters {
  return {
    ingressFrames: 0,
    rejectedFrames: 0,
    senderErrors: 0,
    heartbeatBlackFrames: 0,
    sendsByOutput: {
      audience: 0
    }
  };
}

function debugCountersHaveActivity(counters: NdiDebugCounters): boolean {
  return counters.ingressFrames > 0
    || counters.rejectedFrames > 0
    || counters.senderErrors > 0
    || counters.heartbeatBlackFrames > 0
    || counters.sendsByOutput.audience > 0;
}

export class NdiService {
  private module: NdiNativeModule | null = null;
  private nativeLoadFailed = false;
  private readonly senderEntries = new Map<NdiOutputName, SenderEntry>();
  private outputState: NdiOutputState = createInitialOutputState();
  private pendingFrame: SlideFrame | null = null;
  private flushScheduled = false;
  private readonly blackFrameCache = new Map<string, Uint8Array>();
  private readonly listeners = new Set<OutputStateListener>();
  private readonly loadNativeModule: () => NdiNativeModule;
  private readonly scheduleTask: (task: () => void) => void;
  private readonly now: () => number;
  private readonly setIntervalFn: (task: () => void, delayMs: number) => ReturnType<typeof setInterval>;
  private readonly clearIntervalFn: (intervalId: ReturnType<typeof setInterval>) => void;
  private readonly debugEnabled: boolean;
  private lastFrameIngressAt = 0;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private debugIntervalId: ReturnType<typeof setInterval> | null = null;
  private debugCounters: NdiDebugCounters = createDebugCounters();

  constructor({
    loadNativeModule = defaultNdiModuleLoader,
    scheduleTask = setImmediate,
    now = Date.now,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    debugEnabled = DEBUG_ENABLED_BY_DEFAULT
  }: NdiServiceOptions = {}) {
    this.loadNativeModule = loadNativeModule;
    this.scheduleTask = scheduleTask;
    this.now = now;
    this.setIntervalFn = setIntervalFn;
    this.clearIntervalFn = clearIntervalFn;
    this.debugEnabled = debugEnabled;
  }

  onOutputStateChanged(listener: OutputStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getOutputState(): NdiOutputState {
    return { ...this.outputState };
  }

  setOutputEnabled(name: NdiOutputName, enabled: boolean): NdiOutputState {
    const previousState = this.getOutputState();

    if (enabled) {
      const definition = NDI_OUTPUT_DEFINITIONS[name];
      const sender = this.ensureSender(name, definition.defaultWidth, definition.defaultHeight);
      this.outputState[name] = Boolean(sender);
      if (this.outputState[name]) {
        this.lastFrameIngressAt = this.now();
      }
    } else {
      this.disableOutput(name, true);
    }

    this.ensureIntervals();
    this.emitOutputStateChanged(previousState);
    return this.getOutputState();
  }

  sendFrame(frame: SlideFrame): void {
    if (!frameHasValidSize(frame)) {
      this.debugCounters.rejectedFrames += 1;
      return;
    }

    this.debugCounters.ingressFrames += 1;
    this.lastFrameIngressAt = this.now();
    if (!this.hasEnabledOutput()) return;

    this.pendingFrame = frame;
    if (this.flushScheduled) return;

    this.flushScheduled = true;
    this.scheduleTask(this.flushPendingFrame);
  }

  destroy(): void {
    const previousState = this.getOutputState();
    this.stopHeartbeatInterval();
    this.stopDebugInterval();

    for (const output of NDI_OUTPUT_ORDER) {
      this.disableOutput(output, true);
    }

    this.pendingFrame = null;
    this.flushScheduled = false;
    this.blackFrameCache.clear();
    this.lastFrameIngressAt = 0;

    if (this.module) {
      try {
        this.module.destroySender();
      } catch (error) {
        console.warn('[NDI] Failed to shut down native runtime:', error);
      }
    }

    this.module = null;
    this.nativeLoadFailed = false;
    this.resetDebugCounters();
    this.emitOutputStateChanged(previousState);
  }

  private readonly flushPendingFrame = (): void => {
    this.flushScheduled = false;
    const frame = this.pendingFrame;
    this.pendingFrame = null;

    if (!frame || !this.hasEnabledOutput()) return;

    this.sendFrameToEnabledOutputs(frame);
    if (this.pendingFrame) {
      this.flushScheduled = true;
      this.scheduleTask(this.flushPendingFrame);
    }
  };

  private readonly handleHeartbeatInterval = (): void => {
    if (!this.hasEnabledOutput()) return;

    const now = this.now();
    if (this.pendingFrame) return;
    if (this.lastFrameIngressAt > 0 && now - this.lastFrameIngressAt < NO_INPUT_HEARTBEAT_THRESHOLD_MS) return;

    this.sendHeartbeatBlackFrames(now);
  };

  private readonly handleDebugInterval = (): void => {
    this.logDebugCounters();
  };

  private sendFrameToEnabledOutputs(frame: SlideFrame): void {
    const module = this.loadModule();
    if (!module) {
      this.disableAllOutputsForMissingModule();
      return;
    }

    const stride = frame.width * 4;
    const buffer = new Uint8Array(frame.rgba.buffer, frame.rgba.byteOffset, frame.rgba.byteLength);
    const now = this.now();

    for (const output of NDI_OUTPUT_ORDER) {
      if (!this.outputState[output]) continue;

      const sender = this.ensureSender(output, frame.width, frame.height);
      if (!sender) {
        this.handleSenderFailure(output, new Error('Failed to initialize sender for frame dimensions'));
        continue;
      }

      try {
        module.sendRgbaFrame(sender.senderName, buffer, frame.width, frame.height, stride);
        sender.lastFrameSentAt = now;
        sender.lastFrameRgba = new Uint8Array(buffer);
        this.debugCounters.sendsByOutput[output] += 1;
      } catch (error) {
        this.handleSenderFailure(output, error);
      }
    }
  }

  private sendHeartbeatBlackFrames(now: number): void {
    const module = this.loadModule();
    if (!module) {
      this.disableAllOutputsForMissingModule();
      return;
    }

    for (const output of NDI_OUTPUT_ORDER) {
      if (!this.outputState[output]) continue;

      const definition = NDI_OUTPUT_DEFINITIONS[output];
      const existing = this.senderEntries.get(output);
      const sender = this.ensureSender(
        output,
        existing?.width ?? definition.defaultWidth,
        existing?.height ?? definition.defaultHeight
      );

      if (!sender) {
        this.handleSenderFailure(output, new Error('Failed to initialize sender for heartbeat frame'));
        continue;
      }

      const stride = sender.width * 4;
      const buffer = sender.lastFrameRgba ?? this.getBlackFrameBuffer(sender.width, sender.height);

      try {
        module.sendRgbaFrame(sender.senderName, buffer, sender.width, sender.height, stride);
        sender.lastFrameSentAt = now;
        this.debugCounters.sendsByOutput[output] += 1;
        if (!sender.lastFrameRgba) {
          this.debugCounters.heartbeatBlackFrames += 1;
        }
      } catch (error) {
        this.handleSenderFailure(output, error);
      }
    }
  }

  private ensureSender(output: NdiOutputName, width: number, height: number): SenderEntry | null {
    if (width <= 0 || height <= 0) return null;

    const module = this.loadModule();
    if (!module) return null;

    const existing = this.senderEntries.get(output);
    if (existing && existing.width === width && existing.height === height) {
      return existing;
    }

    const definition = NDI_OUTPUT_DEFINITIONS[output];
    try {
      module.initializeSender({
        senderName: definition.senderName,
        width,
        height,
        withAlpha: definition.withAlpha
      });
    } catch (error) {
      console.error(`[NDI] Failed to initialize sender "${definition.senderName}"`, error);
      return null;
    }

    const sender: SenderEntry = {
      output,
      senderName: definition.senderName,
      width,
      height,
      withAlpha: definition.withAlpha,
      lastFrameSentAt: 0,
      lastFrameRgba: existing?.lastFrameRgba ?? null
    };

    this.senderEntries.set(output, sender);
    return sender;
  }

  private disableOutput(output: NdiOutputName, sendBlackFrame: boolean): void {
    const sender = this.senderEntries.get(output);
    if (sender && sendBlackFrame) {
      this.trySendBlackFrame(sender);
    }
    if (sender) {
      this.tryDestroySender(sender.senderName);
      this.senderEntries.delete(output);
    }
    this.outputState[output] = false;
  }

  private disableAllOutputsForMissingModule(): void {
    const previousState = this.getOutputState();
    for (const output of NDI_OUTPUT_ORDER) {
      this.outputState[output] = false;
    }
    this.senderEntries.clear();
    this.ensureIntervals();
    this.emitOutputStateChanged(previousState);
  }

  private ensureIntervals(): void {
    if (this.hasEnabledOutput()) {
      this.startHeartbeatInterval();
      if (this.debugEnabled) {
        this.startDebugInterval();
      }
      return;
    }

    this.stopHeartbeatInterval();
    this.stopDebugInterval();
  }

  private startHeartbeatInterval(): void {
    if (this.heartbeatIntervalId) return;
    this.heartbeatIntervalId = this.setIntervalFn(this.handleHeartbeatInterval, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeatInterval(): void {
    if (!this.heartbeatIntervalId) return;
    this.clearIntervalFn(this.heartbeatIntervalId);
    this.heartbeatIntervalId = null;
  }

  private startDebugInterval(): void {
    if (this.debugIntervalId) return;
    this.debugIntervalId = this.setIntervalFn(this.handleDebugInterval, DEBUG_LOG_INTERVAL_MS);
  }

  private stopDebugInterval(): void {
    if (!this.debugIntervalId) return;
    this.clearIntervalFn(this.debugIntervalId);
    this.debugIntervalId = null;
    this.resetDebugCounters();
  }

  private logDebugCounters(): void {
    if (!debugCountersHaveActivity(this.debugCounters)) return;

    const state = this.getOutputState();
    console.info(
      `[NDI] stats ingress=${this.debugCounters.ingressFrames} rejected=${this.debugCounters.rejectedFrames}`
      + ` sends(audience=${this.debugCounters.sendsByOutput.audience})`
      + ` heartbeatBlack=${this.debugCounters.heartbeatBlackFrames} senderErrors=${this.debugCounters.senderErrors}`
      + ` enabled(audience=${state.audience})`
    );
    this.resetDebugCounters();
  }

  private resetDebugCounters(): void {
    this.debugCounters = createDebugCounters();
  }

  private trySendBlackFrame(sender: SenderEntry): void {
    const module = this.loadModule();
    if (!module) return;

    const width = sender.width || NDI_OUTPUT_DEFINITIONS[sender.output].defaultWidth;
    const height = sender.height || NDI_OUTPUT_DEFINITIONS[sender.output].defaultHeight;
    const stride = width * 4;
    const buffer = this.getBlackFrameBuffer(width, height);

    try {
      module.sendRgbaFrame(sender.senderName, buffer, width, height, stride);
    } catch (error) {
      console.warn(`[NDI] Failed to send black frame for "${sender.senderName}"`, error);
    }
  }

  private tryDestroySender(senderName: string): void {
    if (!this.module) return;
    try {
      this.module.destroySender(senderName);
    } catch (error) {
      console.warn(`[NDI] Failed to destroy sender "${senderName}"`, error);
    }
  }

  private getBlackFrameBuffer(width: number, height: number): Uint8Array {
    const key = `${width}x${height}`;
    const cached = this.blackFrameCache.get(key);
    if (cached) return cached;

    if (this.blackFrameCache.size >= BLACK_FRAME_CACHE_LIMIT) {
      this.blackFrameCache.clear();
    }

    const frame = new Uint8Array(width * height * 4);
    for (let index = 3; index < frame.length; index += 4) {
      frame[index] = 255;
    }
    this.blackFrameCache.set(key, frame);
    return frame;
  }

  private loadModule(): NdiNativeModule | null {
    if (this.module) return this.module;
    if (this.nativeLoadFailed) return null;

    try {
      this.module = this.loadNativeModule();
      this.nativeLoadFailed = false;
      return this.module;
    } catch (error) {
      this.nativeLoadFailed = true;
      console.warn('[NDI] Native module unavailable. Running in no-op mode.', error);
      return null;
    }
  }

  private handleSenderFailure(output: NdiOutputName, error: unknown): void {
    const previousState = this.getOutputState();
    const senderName = NDI_OUTPUT_DEFINITIONS[output].senderName;
    this.debugCounters.senderErrors += 1;
    console.error(`[NDI] Disabling output "${senderName}" after sender failure`, error);
    this.disableOutput(output, false);
    this.ensureIntervals();
    this.emitOutputStateChanged(previousState);
  }

  private hasEnabledOutput(): boolean {
    return this.outputState.audience;
  }

  private emitOutputStateChanged(previousState: NdiOutputState): void {
    const nextState = this.getOutputState();
    if (outputStatesEqual(previousState, nextState)) return;

    for (const listener of this.listeners) {
      listener(nextState);
    }
  }
}
