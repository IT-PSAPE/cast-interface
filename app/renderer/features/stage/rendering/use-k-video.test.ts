import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKVideo } from './use-k-video';

interface FakeVideoElement extends HTMLVideoElement {
  dispatch: (type: string) => void;
  loadMock: ReturnType<typeof vi.fn>;
  pauseMock: ReturnType<typeof vi.fn>;
  playMock: ReturnType<typeof vi.fn>;
  removeAttributeMock: ReturnType<typeof vi.fn>;
}

function createFakeVideo(): FakeVideoElement {
  const listeners = new Map<string, Set<EventListener>>();
  const loadMock = vi.fn();
  const pauseMock = vi.fn();
  const playMock = vi.fn(() => Promise.resolve());
  const removeAttributeMock = vi.fn();
  const video = {
    src: '',
    autoplay: false,
    loop: false,
    muted: false,
    playsInline: false,
    crossOrigin: '',
    preload: '',
    load: loadMock,
    pause: pauseMock,
    play: playMock,
    removeAttribute: removeAttributeMock,
    loadMock,
    pauseMock,
    playMock,
    removeAttributeMock,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      const nextListeners = listeners.get(type) ?? new Set<EventListener>();
      nextListeners.add(listener);
      listeners.set(type, nextListeners);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.get(type)?.delete(listener);
    }),
    dispatch(type: string) {
      listeners.get(type)?.forEach((listener) => listener(new Event(type)));
    },
  } as unknown as FakeVideoElement;

  return video;
}

describe('useKVideo', () => {
  const originalCreateElement = document.createElement.bind(document);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the current video active until the replacement has frame data', () => {
    const createdVideos: FakeVideoElement[] = [];
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'video') {
        const video = createFakeVideo();
        createdVideos.push(video);
        return video;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const { result, rerender } = renderHook(
      ({ src }) => useKVideo(src, { autoplay: false, loop: true, muted: true }),
      { initialProps: { src: '/media-a.mp4' } },
    );

    const firstVideo = createdVideos[0];

    act(() => {
      firstVideo.dispatch('loadeddata');
    });

    expect(result.current).toEqual({ status: 'loaded', resource: firstVideo });

    rerender({ src: '/media-b.mp4' });

    const secondVideo = createdVideos[1];

    expect(result.current).toEqual({ status: 'loading' });
    expect(firstVideo.pauseMock).not.toHaveBeenCalled();

    act(() => {
      secondVideo.dispatch('loadeddata');
    });

    expect(result.current).toEqual({ status: 'loaded', resource: secondVideo });
    expect(firstVideo.pauseMock).toHaveBeenCalledTimes(1);
    expect(firstVideo.removeAttributeMock).toHaveBeenCalledWith('src');
  });

  it('reports broken when the requested video errors before loading', () => {
    const createdVideos: FakeVideoElement[] = [];
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'video') {
        const video = createFakeVideo();
        createdVideos.push(video);
        return video;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const { result } = renderHook(() => useKVideo('/missing.mp4', { autoplay: false, loop: false, muted: true }));

    act(() => {
      createdVideos[0].dispatch('error');
    });

    expect(result.current).toEqual({ status: 'broken' });
  });
});
