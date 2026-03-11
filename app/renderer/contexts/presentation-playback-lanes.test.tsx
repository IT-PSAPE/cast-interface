import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSnapshot, Library, LibraryPlaylistBundle, Playlist, PlaylistEntry, PlaylistSegment, PlaylistTree, Presentation, Slide, SlideElement } from '@core/types';
import { NavigationProvider, useNavigation } from './navigation-context';
import { PresentationLayerProvider, usePresentationLayers } from './presentation-layer-context';
import { SlideProvider, useSlides } from './slide-context';
import { useCast } from './cast-context';
import { RenderSceneProvider, useRenderScenes } from '../features/stage/rendering/render-scene-provider';
import { useElements } from './element-context';
import { useOverlayEditor } from './overlay-editor-context';
import { useSlideEditor } from './slide-editor-context';
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

function createPresentation(id: string, title: string): Presentation {
  return {
    id,
    title,
    entityType: 'presentation',
    kind: 'canvas',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createSlide(id: string, presentationId: string, order: number): Slide {
  return {
    id,
    presentationId,
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
  const helloWorld = createPresentation('presentation-1', 'Hello World');
  const secondPresentation = createPresentation('presentation-2', 'Second Presentation');
  const playlistEntry: PlaylistEntry = {
    id: 'entry-1',
    segmentId: segment.id,
    presentationId: helloWorld.id,
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
        presentation: helloWorld,
      }],
    }],
  };
  const libraryBundle: LibraryPlaylistBundle = {
    library,
    playlists: [playlistTree],
  };

  return {
    libraries: [library],
    libraryBundles: [libraryBundle],
    presentations: [helloWorld, secondPresentation],
    slides: [
      createSlide('slide-1', helloWorld.id, 0),
      createSlide('slide-2', helloWorld.id, 1),
      createSlide('slide-3', helloWorld.id, 2),
      createSlide('slide-4', secondPresentation.id, 0),
      createSlide('slide-5', secondPresentation.id, 1),
    ],
    slideElements: [
      createElement('element-1', 'slide-1', 'Hello Fat World'),
      createElement('element-2', 'slide-2', 'Hellow world'),
      createElement('element-3', 'slide-4', 'HELLO ITS ME'),
    ],
    mediaAssets: [],
    overlays: [],
  };
}

function TestProviders() {
  return (
    <NavigationProvider>
      <PresentationLayerProvider>
        <SlideProvider>
          <RenderSceneProvider>
            <Probe />
          </RenderSceneProvider>
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
      expect(probeValue?.navigation.currentOutputPresentationId).toBe('presentation-1');
    });

    act(() => {
      probeValue?.slides.activateSlide(1);
    });

    expect(probeValue?.slides.liveSlide?.id).toBe('slide-2');
    expect(probeValue?.renderScenes.liveScene.nodes).toHaveLength(1);

    act(() => {
      probeValue?.navigation.browsePresentation('presentation-2');
    });

    expect(probeValue?.navigation.currentPresentationId).toBe('presentation-2');
    expect(probeValue?.navigation.currentOutputPresentationId).toBe('presentation-1');
    expect(probeValue?.slides.currentSlide?.id).toBe('slide-4');
    expect(probeValue?.slides.liveSlide?.id).toBe('slide-2');
    expect(probeValue?.renderScenes.liveScene.nodes).toHaveLength(1);
    expect(probeValue?.renderScenes.liveScene.slide.id).toBe('slide-2');
    expect(probeValue?.layers.contentLayerVisible).toBe(true);
  });

  it('stores independent slide selection for the playlist lane and the drawer lane', async () => {
    render(<TestProviders />);

    await waitFor(() => {
      expect(probeValue?.navigation.currentPresentationId).toBe('presentation-1');
    });

    act(() => {
      probeValue?.slides.setCurrentSlideIndex(1);
    });

    expect(probeValue?.slides.currentSlideIndex).toBe(1);

    act(() => {
      probeValue?.navigation.browsePresentation('presentation-1');
    });

    expect(probeValue?.navigation.isDetachedPresentationBrowser).toBe(true);
    expect(probeValue?.slides.currentSlideIndex).toBe(0);

    act(() => {
      probeValue?.slides.setCurrentSlideIndex(2);
    });

    expect(probeValue?.slides.currentSlideIndex).toBe(2);

    act(() => {
      probeValue?.slides.selectPlaylistPresentation('presentation-1');
    });

    expect(probeValue?.navigation.isDetachedPresentationBrowser).toBe(false);
    expect(probeValue?.slides.currentSlideIndex).toBe(1);

    act(() => {
      probeValue?.navigation.browsePresentation('presentation-1');
    });

    expect(probeValue?.navigation.isDetachedPresentationBrowser).toBe(true);
    expect(probeValue?.slides.currentSlideIndex).toBe(2);
  });

  it('disarms output only through clear actions and does not rearm when browsing from the drawer', async () => {
    render(<TestProviders />);

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputPresentationId).toBe('presentation-1');
    });

    act(() => {
      probeValue?.slides.activateSlide(1);
    });

    expect(probeValue?.slides.liveSlide?.id).toBe('slide-2');

    act(() => {
      probeValue?.layers.clearAllLayers();
    });

    expect(probeValue?.navigation.currentOutputPresentationId).toBeNull();
    expect(probeValue?.slides.liveSlide).toBeNull();
    expect(probeValue?.layers.contentLayerVisible).toBe(false);

    act(() => {
      probeValue?.navigation.browsePresentation('presentation-2');
    });

    expect(probeValue?.navigation.currentOutputPresentationId).toBeNull();
    expect(probeValue?.slides.liveSlide).toBeNull();

    act(() => {
      probeValue?.slides.selectPlaylistPresentation('presentation-1');
    });

    await waitFor(() => {
      expect(probeValue?.navigation.currentOutputPresentationId).toBe('presentation-1');
      expect(probeValue?.layers.contentLayerVisible).toBe(true);
    });
  });
});
