import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSnapshot, Deck, Library, LibraryPlaylistBundle, Lyric, Playlist, PlaylistEntry, PlaylistSegment, PlaylistTree, Slide, SlideElement } from '@core/types';
import { NavigationProvider, useNavigation } from './navigation-context';
import { PresentationLayerProvider, usePresentationLayers } from './presentation-layer-context';
import { SlideProvider, useSlides } from './slide-context';
import { useCast } from './cast-context';
import { RenderSceneProvider, useRenderScenes } from '../features/stage/rendering/render-scene-provider';
import { useElements } from './element-context';
import { useOverlayEditor } from './overlay-editor-context';
import { useSlideEditor } from './slide-editor-context';
import { TemplateEditorProvider } from './template-editor-context';
import { useWorkbench } from './workbench-context';

vi.mock('./cast-context', () => ({
  useCast: vi.fn(),
}));

vi.mock('./element-context', () => ({
  useElements: vi.fn(),
}));

vi.mock('./overlay-editor-context', () => ({
  useOverlayEditor: vi.fn(),
}));

vi.mock('./slide-editor-context', () => ({
  useSlideEditor: vi.fn(),
}));

vi.mock('./workbench-context', () => ({
  useWorkbench: vi.fn(),
}));

interface ProbeValue {
  navigation: ReturnType<typeof useNavigation>;
  layers: ReturnType<typeof usePresentationLayers>;
  slides: ReturnType<typeof useSlides>;
  renderScenes: ReturnType<typeof useRenderScenes>;
}

let probeValue: ProbeValue | null = null;

function Probe() {
  probeValue = {
    navigation: useNavigation(),
    layers: usePresentationLayers(),
    slides: useSlides(),
    renderScenes: useRenderScenes(),
  };
  return null;
}

function createPresentation(id: string, title: string): Deck {
  return {
    id,
    title,
    type: 'deck',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createLyric(id: string, title: string): Lyric {
  return {
    id,
    title,
    type: 'lyric',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createSlide(id: string, itemId: string, order: number, type: 'deck' | 'lyric' = 'deck'): Slide {
  return {
    id,
    deckId: type === 'deck' ? itemId : null,
    lyricId: type === 'lyric' ? itemId : null,
    width: 1920,
    height: 1080,
    notes: '',
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createElement(id: string, slideId: string, text: string): SlideElement {
  return {
    id,
    slideId,
    type: 'text',
    x: 100,
    y: 100,
    width: 600,
    height: 120,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'content',
    payload: {
      text,
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      weight: '700',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createSnapshot(): AppSnapshot {
  const library: Library = {
    id: 'library-1',
    name: 'Library',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const playlist: Playlist = {
    id: 'playlist-1',
    libraryId: library.id,
    name: 'Playlist',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const segment: PlaylistSegment = {
    id: 'segment-1',
    playlistId: playlist.id,
    name: 'Segment',
    order: 0,
    colorKey: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const lyricPlaylist: Playlist = {
    id: 'playlist-2',
    libraryId: library.id,
    name: 'Lyrics',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const lyricSegment: PlaylistSegment = {
    id: 'segment-2',
    playlistId: lyricPlaylist.id,
    name: 'Lyrics Segment',
    order: 0,
    colorKey: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const helloWorld = createPresentation('presentation-1', 'Hello World');
  const secondPresentation = createPresentation('presentation-2', 'Second Presentation');
  const lyricPresentation = createLyric('presentation-3', 'Song Verse');
  const playlistEntry: PlaylistEntry = {
    id: 'entry-1',
    segmentId: segment.id,
    deckId: helloWorld.id,
    lyricId: null,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const lyricEntry: PlaylistEntry = {
    id: 'entry-2',
    segmentId: lyricSegment.id,
    deckId: null,
    lyricId: lyricPresentation.id,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const playlistTree: PlaylistTree = {
    playlist,
    segments: [{
      segment,
      entries: [{
        entry: playlistEntry,
        item: helloWorld,
      }],
    }],
  };
  const lyricPlaylistTree: PlaylistTree = {
    playlist: lyricPlaylist,
    segments: [{
      segment: lyricSegment,
      entries: [{
        entry: lyricEntry,
        item: lyricPresentation,
      }],
    }],
  };
  const libraryBundle: LibraryPlaylistBundle = {
    library,
    playlists: [playlistTree, lyricPlaylistTree],
  };

  return {
    libraries: [library],
    libraryBundles: [libraryBundle],
    decks: [helloWorld, secondPresentation],
    lyrics: [lyricPresentation],
    slides: [
      createSlide('slide-1', helloWorld.id, 0, 'deck'),
      createSlide('slide-2', helloWorld.id, 1, 'deck'),
      createSlide('slide-3', helloWorld.id, 2, 'deck'),
      createSlide('slide-4', secondPresentation.id, 0, 'deck'),
      createSlide('slide-5', secondPresentation.id, 1, 'deck'),
      createSlide('slide-6', lyricPresentation.id, 0, 'lyric'),
    ],
    slideElements: [
      createElement('element-1', 'slide-1', 'Hello Fat World'),
      createElement('element-2', 'slide-2', 'Hellow world'),
      createElement('element-3', 'slide-4', 'HELLO ITS ME'),
      createElement('element-4', 'slide-6', 'Song Verse'),
    ],
    mediaAssets: [],
    overlays: [],
    templates: [],
  };
}

function TestProviders() {
  return (
    <NavigationProvider>
      <PresentationLayerProvider>
        <SlideProvider>
          <TemplateEditorProvider>
            <RenderSceneProvider>
              <Probe />
            </RenderSceneProvider>
          </TemplateEditorProvider>
        </SlideProvider>
      </PresentationLayerProvider>
    </NavigationProvider>
  );
}

describe('presentation playback lanes', () => {
  const mutate = vi.fn();
  const setStatusText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    probeValue = null;

    vi.mocked(useCast).mockReturnValue({
      snapshot: createSnapshot(),
      statusText: 'Ready',
      setStatusText,
      mutate,
    });
    vi.mocked(useElements).mockReturnValue({
      effectiveElements: [],
    } as unknown as ReturnType<typeof useElements>);
    vi.mocked(useOverlayEditor).mockReturnValue({
      currentOverlay: null,
    } as unknown as ReturnType<typeof useOverlayEditor>);
    vi.mocked(useSlideEditor).mockReturnValue({
      getSlideElements: () => [],
    } as unknown as ReturnType<typeof useSlideEditor>);
    vi.mocked(useWorkbench).mockReturnValue({
      workbenchMode: 'show',
    } as unknown as ReturnType<typeof useWorkbench>);
  });

  it('keeps output armed to the playlist while browsing another presentation from the drawer', async () => {
    render(<TestProviders />);

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputContentItemId).toBeNull();
      expect(probeValue?.navigation.currentContentItemId).toBeNull();
    });

    act(() => {
      probeValue?.slides.activateContentItemSlide('presentation-1', 0);
    });

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputContentItemId).toBe('presentation-1');
      expect(probeValue?.navigation.currentContentItemId).toBe('presentation-1');
    });

    act(() => {
      probeValue?.slides.activateSlide(1);
    });

    expect(probeValue?.slides.liveSlide?.id).toBe('slide-2');
    expect(probeValue?.renderScenes.liveScene.nodes).toHaveLength(1);

    act(() => {
      probeValue?.navigation.browseContentItem('presentation-2');
    });

    expect(probeValue?.navigation.currentContentItemId).toBe('presentation-2');
    expect(probeValue?.navigation.currentOutputContentItemId).toBe('presentation-1');
    expect(probeValue?.slides.currentSlide?.id).toBe('slide-4');
    expect(probeValue?.slides.liveSlide?.id).toBe('slide-2');
    expect(probeValue?.renderScenes.liveScene.nodes).toHaveLength(1);
    expect(probeValue?.renderScenes.liveScene.slide.id).toBe('slide-2');
    expect(probeValue?.layers.contentLayerVisible).toBe(true);
  });

  it('stores independent slide selection for the playlist lane and the drawer lane', async () => {
    render(<TestProviders />);

    await waitFor(() => {
      expect(probeValue?.navigation.currentContentItemId).toBeNull();
    });

    act(() => {
      probeValue?.slides.selectPlaylistContentItem('presentation-1');
    });

    await waitFor(() => {
      expect(probeValue?.navigation.currentContentItemId).toBe('presentation-1');
    });

    act(() => {
      probeValue?.slides.setCurrentSlideIndex(1);
    });

    expect(probeValue?.slides.currentSlideIndex).toBe(1);

    act(() => {
      probeValue?.navigation.browseContentItem('presentation-1');
    });

    expect(probeValue?.navigation.isDetachedContentBrowser).toBe(true);
    expect(probeValue?.slides.currentSlideIndex).toBe(0);

    act(() => {
      probeValue?.slides.setCurrentSlideIndex(2);
    });

    expect(probeValue?.slides.currentSlideIndex).toBe(2);

    act(() => {
      probeValue?.slides.selectPlaylistContentItem('presentation-1');
    });

    expect(probeValue?.navigation.isDetachedContentBrowser).toBe(false);
    expect(probeValue?.slides.currentSlideIndex).toBe(1);

    act(() => {
      probeValue?.navigation.browseContentItem('presentation-1');
    });

    expect(probeValue?.navigation.isDetachedContentBrowser).toBe(true);
    expect(probeValue?.slides.currentSlideIndex).toBe(2);
  });

  it('disarms output only through clear actions and does not rearm when browsing from the drawer', async () => {
    render(<TestProviders />);

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputContentItemId).toBeNull();
    });

    act(() => {
      probeValue?.slides.activateContentItemSlide('presentation-1', 0);
    });

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputContentItemId).toBe('presentation-1');
    });

    act(() => {
      probeValue?.slides.activateSlide(1);
    });

    expect(probeValue?.slides.liveSlide?.id).toBe('slide-2');

    act(() => {
      probeValue?.layers.clearAllLayers();
      probeValue?.slides.clearCurrentSlideSelection();
    });

    expect(probeValue?.navigation.currentOutputContentItemId).toBeNull();
    expect(probeValue?.slides.liveSlide).toBeNull();
    expect(probeValue?.slides.currentSlide).toBeNull();
    expect(probeValue?.slides.currentSlideIndex).toBe(-1);
    expect(probeValue?.layers.contentLayerVisible).toBe(false);

    act(() => {
      probeValue?.navigation.browseContentItem('presentation-2');
    });

    expect(probeValue?.navigation.currentOutputContentItemId).toBeNull();
    expect(probeValue?.slides.liveSlide).toBeNull();

    act(() => {
      probeValue?.slides.selectPlaylistContentItem('presentation-1');
    });

    expect(probeValue?.navigation.currentOutputContentItemId).toBeNull();
    expect(probeValue?.slides.liveSlide).toBeNull();

    act(() => {
      probeValue?.slides.activateContentItemSlide('presentation-1', 0);
    });

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputContentItemId).toBe('presentation-1');
      expect(probeValue?.layers.contentLayerVisible).toBe(true);
    });
  });

  it('keeps a lyric presentation armed and selected when switching playlists', async () => {
    render(<TestProviders />);

    await waitFor(() => {
      expect(probeValue?.navigation.currentPlaylistId).toBe('playlist-1');
      expect(probeValue?.navigation.currentContentItemId).toBeNull();
    });

    act(() => {
      probeValue?.navigation.setCurrentPlaylistId('playlist-2');
    });

    expect(probeValue?.navigation.currentContentItemId).toBeNull();
    expect(probeValue?.navigation.currentPlaylistContentItemId).toBeNull();

    act(() => {
      probeValue?.slides.activateContentItemSlide('presentation-3', 0);
    });

    await waitFor(() => {
      expect(probeValue?.navigation.currentPlaylistContentItemId).toBe('presentation-3');
      expect(probeValue?.navigation.currentOutputContentItemId).toBe('presentation-3');
      expect(probeValue?.navigation.currentContentItemId).toBe('presentation-3');
    });

    act(() => {
      probeValue?.navigation.setCurrentPlaylistId('playlist-1');
    });

    expect(probeValue?.navigation.currentPlaylistId).toBe('playlist-1');
    expect(probeValue?.navigation.currentPlaylistContentItemId).toBeNull();
    expect(probeValue?.navigation.currentOutputContentItemId).toBe('presentation-3');
    expect(probeValue?.navigation.currentContentItemId).toBeNull();
    expect(probeValue?.slides.liveSlide?.id).toBe('slide-6');
  });
});
