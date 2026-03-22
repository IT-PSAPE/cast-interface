import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowAudioProvider, useShowAudio } from './show-audio-context';
import { useProjectContent } from '../../../contexts/use-project-content';

vi.mock('../../../contexts/use-project-content', () => ({
  useProjectContent: vi.fn(),
}));

interface FakeAudioElement extends HTMLAudioElement {
  dispatch: (type: string) => void;
  loadMock: ReturnType<typeof vi.fn>;
  pauseMock: ReturnType<typeof vi.fn>;
  playMock: ReturnType<typeof vi.fn>;
  removeAttributeMock: ReturnType<typeof vi.fn>;
}

function createFakeAudioElement(): FakeAudioElement {
  const listeners = new Map<string, Set<EventListener>>();
  const loadMock = vi.fn();
  const pauseMock = vi.fn();
  const playMock = vi.fn(() => {
    listeners.get('play')?.forEach((listener) => listener(new Event('play')));
    return Promise.resolve();
  });
  const removeAttributeMock = vi.fn((name: string) => {
    if (name === 'src') {
      audio.src = '';
    }
  });
  const audio = {
    src: '',
    currentTime: 0,
    duration: 0,
    loop: false,
    preload: 'metadata',
    dataset: {} as DOMStringMap,
    loadMock,
    pauseMock,
    playMock,
    removeAttributeMock,
    load() {
      loadMock();
    },
    pause() {
      pauseMock();
      listeners.get('pause')?.forEach((listener) => listener(new Event('pause')));
    },
    play() {
      return playMock();
    },
    removeAttribute(name: string) {
      removeAttributeMock(name);
    },
    addEventListener(type: string, listener: EventListener) {
      const nextListeners = listeners.get(type) ?? new Set<EventListener>();
      nextListeners.add(listener);
      listeners.set(type, nextListeners);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type: string) {
      listeners.get(type)?.forEach((listener) => listener(new Event(type)));
    },
  } as unknown as FakeAudioElement;

  return audio;
}

describe('ShowAudioProvider', () => {
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.mocked(useProjectContent).mockReturnValue({
      presentations: [],
      slides: [],
      slideElements: [],
      mediaAssets: [
        { id: 'audio-1', name: 'Walk In', type: 'audio', src: 'cast-media://walk-in.mp3', createdAt: '', updatedAt: '' },
        { id: 'audio-2', name: 'Outro', type: 'audio', src: 'cast-media://outro.mp3', createdAt: '', updatedAt: '' },
      ],
      overlays: [],
      templates: [],
      presentationsById: new Map(),
      slidesByPresentationId: new Map(),
      slideElementsBySlideId: new Map(),
      mediaAssetsById: new Map(),
      overlaysById: new Map(),
      templatesById: new Map(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resets playback to the first audio asset when cleared', () => {
    const fakeAudio = createFakeAudioElement();

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'audio') {
        return fakeAudio;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const wrapper = ({ children }: { children: React.ReactNode }) => <ShowAudioProvider>{children}</ShowAudioProvider>;
    const { result } = renderHook(() => useShowAudio(), { wrapper });

    act(() => {
      result.current.actions.selectAudio('audio-2');
    });

    expect(result.current.state.currentAudioAssetId).toBe('audio-2');

    act(() => {
      result.current.actions.play();
    });

    expect(fakeAudio.playMock).toHaveBeenCalled();

    act(() => {
      result.current.actions.clearAudio();
    });

    expect(result.current.state.currentAudioAssetId).toBe('audio-1');
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.currentTime).toBe(0);
    expect(fakeAudio.pauseMock).toHaveBeenCalled();
  });
});
