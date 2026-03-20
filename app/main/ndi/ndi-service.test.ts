import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultNdiOutputConfigs } from '@core/ndi';
import { NdiService } from './ndi-service';
import type { NdiNativeModule } from './ndi-native-module';

describe('NdiService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not heartbeat while fresh frames are still arriving', () => {
    const sendRgbaFrame = vi.fn();
    const moduleLoader = vi.fn<() => NdiNativeModule>(() => ({
      initializeSender: vi.fn(),
      sendRgbaFrame,
      destroySender: vi.fn(),
      getRuntimeInfo: () => ({ loaded: true, path: null }),
    }));
    const service = new NdiService({
      outputConfigs: createDefaultNdiOutputConfigs(),
      onOutputConfigsChanged: vi.fn(),
      moduleLoader,
    });
    const frame = new Uint8Array(16);

    service.setOutputEnabled('audience', true);
    service.receiveFrame(frame, 2, 2);
    expect(sendRgbaFrame).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(66);
    expect(sendRgbaFrame).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-03-20T12:00:00.099Z'));
    vi.advanceTimersByTime(33);
    expect(sendRgbaFrame).toHaveBeenCalledTimes(2);
  });
});
