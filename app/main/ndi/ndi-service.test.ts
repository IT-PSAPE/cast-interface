import { describe, expect, it, vi } from 'vitest';
import type { SlideFrame } from '@core/types';
import { NdiService } from './ndi-service';
import type { NdiNativeModule } from './ndi-native-module';

const HEARTBEAT_INTERVAL_MS = Math.round(1000 / 30);

interface NativeModuleMock {
  module: NdiNativeModule;
  initializeSender: ReturnType<typeof vi.fn>;
  sendRgbaFrame: ReturnType<typeof vi.fn>;
  destroySender: ReturnType<typeof vi.fn>;
  getSenderConnections: ReturnType<typeof vi.fn>;
}

interface NativeModuleOptions {
  connectionCount?: number;
  includeConnectionProbe?: boolean;
}

interface IntervalEntry {
  id: number;
  delayMs: number;
  task: () => void;
  active: boolean;
}

interface IntervalController {
  setIntervalFn: (task: () => void, delayMs: number) => ReturnType<typeof setInterval>;
  clearIntervalFn: (intervalId: ReturnType<typeof setInterval>) => void;
  runByDelay: (delayMs: number) => void;
}

function createNativeModuleMock({ connectionCount = 1, includeConnectionProbe = true }: NativeModuleOptions = {}): NativeModuleMock {
  const initializeSender = vi.fn();
  const sendRgbaFrame = vi.fn();
  const destroySender = vi.fn();
  const getSenderConnections = vi.fn(() => connectionCount);

  const module: NdiNativeModule = {
    initializeSender,
    sendRgbaFrame,
    destroySender,
    ...(includeConnectionProbe ? { getSenderConnections } : {})
  };

  return { module, initializeSender, sendRgbaFrame, destroySender, getSenderConnections };
}

function createFrame(width: number, height: number): SlideFrame {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let index = 3; index < rgba.length; index += 4) {
    rgba[index] = 255;
  }
  return {
    width,
    height,
    rgba,
    timestamp: Date.now()
  };
}

function flushAllScheduled(queue: Array<() => void>) {
  while (queue.length > 0) {
    const task = queue.shift();
    if (!task) break;
    task();
  }
}

function createIntervalController(): IntervalController {
  const intervals: IntervalEntry[] = [];
  let nextIntervalId = 1;

  function setIntervalFn(task: () => void, delayMs: number): ReturnType<typeof setInterval> {
    const entry: IntervalEntry = {
      id: nextIntervalId,
      delayMs,
      task,
      active: true
    };
    nextIntervalId += 1;
    intervals.push(entry);
    return entry.id as unknown as ReturnType<typeof setInterval>;
  }

  function clearIntervalFn(intervalId: ReturnType<typeof setInterval>) {
    const id = Number(intervalId);
    const interval = intervals.find((entry) => entry.id === id);
    if (!interval) return;
    interval.active = false;
  }

  function runByDelay(delayMs: number) {
    for (const interval of intervals) {
      if (!interval.active) continue;
      if (interval.delayMs !== delayMs) continue;
      interval.task();
    }
  }

  return {
    setIntervalFn,
    clearIntervalFn,
    runByDelay
  };
}

describe('NdiService', () => {
  it('enables the audience output', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    const service = new NdiService({
      loadNativeModule: () => native.module,
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    const state = service.setOutputEnabled('audience', true);

    expect(state).toEqual({ audience: true });
    expect(native.initializeSender).toHaveBeenCalledTimes(1);
    expect(native.initializeSender).toHaveBeenCalledWith({
      senderName: 'Cast Interface - Audience',
      width: 1920,
      height: 1080,
      withAlpha: true
    });
  });

  it('fans one frame out to the enabled audience output', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    const scheduled: Array<() => void> = [];
    const service = new NdiService({
      loadNativeModule: () => native.module,
      scheduleTask: (task) => {
        scheduled.push(task);
      },
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    service.setOutputEnabled('audience', true);
    service.sendFrame(createFrame(4, 4));
    flushAllScheduled(scheduled);

    expect(native.sendRgbaFrame).toHaveBeenCalledTimes(1);
    expect(native.sendRgbaFrame).toHaveBeenCalledWith('Cast Interface - Audience', expect.any(Uint8Array), 4, 4, 16);
  });

  it('keeps only the latest queued frame while back-pressured', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    const scheduled: Array<() => void> = [];
    const service = new NdiService({
      loadNativeModule: () => native.module,
      scheduleTask: (task) => {
        scheduled.push(task);
      },
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    service.setOutputEnabled('audience', true);
    service.sendFrame(createFrame(2, 2));
    service.sendFrame(createFrame(3, 3));
    flushAllScheduled(scheduled);

    expect(native.sendRgbaFrame).toHaveBeenCalledTimes(1);
    expect(native.sendRgbaFrame).toHaveBeenLastCalledWith('Cast Interface - Audience', expect.any(Uint8Array), 3, 3, 12);
  });

  it('sends heartbeat black frames when input is stale and no live frame was sent yet', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    let now = 100;
    const service = new NdiService({
      loadNativeModule: () => native.module,
      now: () => now,
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    service.setOutputEnabled('audience', true);

    now = 130;
    intervals.runByDelay(HEARTBEAT_INTERVAL_MS);
    expect(native.sendRgbaFrame).toHaveBeenCalledTimes(0);

    now = 180;
    intervals.runByDelay(HEARTBEAT_INTERVAL_MS);
    expect(native.sendRgbaFrame).toHaveBeenCalledTimes(1);
    expect(native.sendRgbaFrame).toHaveBeenLastCalledWith('Cast Interface - Audience', expect.any(Uint8Array), 1920, 1080, 7680);
  });

  it('repeats the last live frame during heartbeat gaps', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    const scheduled: Array<() => void> = [];
    let now = 100;
    const service = new NdiService({
      loadNativeModule: () => native.module,
      scheduleTask: (task) => {
        scheduled.push(task);
      },
      now: () => now,
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    service.setOutputEnabled('audience', true);
    service.sendFrame(createFrame(4, 4));
    flushAllScheduled(scheduled);

    const lastLiveBuffer = native.sendRgbaFrame.mock.calls[0]?.[1];

    now = 240;
    intervals.runByDelay(HEARTBEAT_INTERVAL_MS);

    expect(native.sendRgbaFrame).toHaveBeenCalledTimes(2);
    expect(native.sendRgbaFrame).toHaveBeenLastCalledWith('Cast Interface - Audience', lastLiveBuffer, 4, 4, 16);
  });

  it('continues to send when connection probe is unavailable', () => {
    const native = createNativeModuleMock({ includeConnectionProbe: false });
    const intervals = createIntervalController();
    const scheduled: Array<() => void> = [];
    const service = new NdiService({
      loadNativeModule: () => native.module,
      scheduleTask: (task) => {
        scheduled.push(task);
      },
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    service.setOutputEnabled('audience', true);

    service.sendFrame(createFrame(4, 4));
    flushAllScheduled(scheduled);
    service.sendFrame(createFrame(4, 4));
    flushAllScheduled(scheduled);
    service.sendFrame(createFrame(4, 4));
    flushAllScheduled(scheduled);

    expect(native.sendRgbaFrame).toHaveBeenCalledTimes(3);
    expect(native.getSenderConnections).toHaveBeenCalledTimes(0);
  });

  it('reinitializes sender when frame dimensions change', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    const scheduled: Array<() => void> = [];
    const service = new NdiService({
      loadNativeModule: () => native.module,
      scheduleTask: (task) => {
        scheduled.push(task);
      },
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    service.setOutputEnabled('audience', true);
    service.sendFrame(createFrame(2, 2));
    flushAllScheduled(scheduled);
    service.sendFrame(createFrame(3, 3));
    flushAllScheduled(scheduled);

    expect(native.initializeSender).toHaveBeenCalledWith({
      senderName: 'Cast Interface - Audience',
      width: 2,
      height: 2,
      withAlpha: true
    });
    expect(native.initializeSender).toHaveBeenCalledWith({
      senderName: 'Cast Interface - Audience',
      width: 3,
      height: 3,
      withAlpha: true
    });
  });

  it('disables an output when native send fails', () => {
    const native = createNativeModuleMock();
    const intervals = createIntervalController();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    native.sendRgbaFrame.mockImplementation(() => {
      throw new Error('send failed');
    });
    const scheduled: Array<() => void> = [];
    const service = new NdiService({
      loadNativeModule: () => native.module,
      scheduleTask: (task) => {
        scheduled.push(task);
      },
      setIntervalFn: intervals.setIntervalFn,
      clearIntervalFn: intervals.clearIntervalFn
    });

    try {
      service.setOutputEnabled('audience', true);
      service.sendFrame(createFrame(4, 4));
      flushAllScheduled(scheduled);

      expect(service.getOutputState()).toEqual({ audience: false });
      expect(native.destroySender).toHaveBeenCalledWith('Cast Interface - Audience');
    } finally {
      errorSpy.mockRestore();
    }
  });
});
