import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSnapshot, LibraryBundle, Slide, SlideElement } from '@core/types';
import { SlideEditorProvider, useSlideEditor } from './slide-editor-context';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useSlides } from './slide-context';
import { useWorkbench } from './workbench-context';

vi.mock('./cast-context', () => ({
  useCast: vi.fn(),
}));

vi.mock('./navigation-context', () => ({
  useNavigation: vi.fn(),
}));

vi.mock('./slide-context', () => ({
  useSlides: vi.fn(),
}));

vi.mock('./workbench-context', () => ({
  useWorkbench: vi.fn(),
}));

let probeValue: ReturnType<typeof useSlideEditor> | null = null;

function Probe() {
  probeValue = useSlideEditor();
  return null;
}

function createSlide(): Slide {
  return {
    id: 'slide-1',
    presentationId: 'presentation-1',
    width: 1920,
    height: 1080,
    notes: '',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createElement(overrides: Partial<SlideElement> = {}): SlideElement {
  return {
    id: 'element-1',
    slideId: 'slide-1',
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
      text: 'Hello',
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      weight: '700',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createBundle(slideElements: SlideElement[]): LibraryBundle {
  return {
    library: {
      id: 'library-1',
      name: 'Library',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    presentations: [],
    slides: [createSlide()],
    slideElements,
    playlists: [],
    mediaAssets: [],
    overlays: [],
  };
}

function createSnapshot(slideElements: SlideElement[]): AppSnapshot {
  return {
    libraries: [{
      id: 'library-1',
      name: 'Library',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    bundles: [createBundle(slideElements)],
  };
}

describe('SlideEditorProvider', () => {
  const updateElement = vi.fn();
  const updateElementsBatch = vi.fn();
  const createElementApi = vi.fn();
  const createElementsBatch = vi.fn();
  const deleteElementsBatch = vi.fn();
  const getSnapshot = vi.fn();
  const mutate = vi.fn(async (action: () => Promise<AppSnapshot>) => action());
  const setStatusText = vi.fn();

  let activeBundle: LibraryBundle;
  let workbenchMode: 'show' | 'slide-editor' | 'overlay-editor';

  beforeEach(() => {
    vi.clearAllMocks();
    probeValue = null;
    activeBundle = createBundle([createElement()]);
    workbenchMode = 'slide-editor';

    window.castApi = {
      updateElement,
      updateElementsBatch,
      createElement: createElementApi,
      createElementsBatch,
      deleteElementsBatch,
      getSnapshot,
    } as unknown as Window['castApi'];

    vi.mocked(useCast).mockReturnValue({
      snapshot: createSnapshot(activeBundle.slideElements),
      statusText: 'Ready',
      setStatusText,
      mutate,
    });
    vi.mocked(useNavigation).mockImplementation(() => ({
      activeBundle,
    } as ReturnType<typeof useNavigation>));
    vi.mocked(useSlides).mockImplementation(() => ({
      currentSlide: createSlide(),
    } as ReturnType<typeof useSlides>));
    vi.mocked(useWorkbench).mockImplementation(() => ({
      workbenchMode,
    } as ReturnType<typeof useWorkbench>));
  });

  it('stages slide edits locally until push', () => {
    render(
      <SlideEditorProvider>
        <Probe />
      </SlideEditorProvider>,
    );

    if (!probeValue) throw new Error('Expected slide editor context');

    act(() => {
      probeValue?.replaceSlideElements('slide-1', [createElement({ x: 240 })]);
    });

    expect(probeValue.getSlideElements('slide-1')[0]?.x).toBe(240);
    expect(probeValue.hasPendingChanges).toBe(true);
    expect(updateElement).not.toHaveBeenCalled();
  });

  it('pushes slide edits when leaving edit view', async () => {
    const pushedElement = createElement({ x: 240 });
    updateElement.mockResolvedValue(createSnapshot([pushedElement]));

    const view = render(
      <SlideEditorProvider>
        <Probe />
      </SlideEditorProvider>,
    );

    if (!probeValue) throw new Error('Expected slide editor context');

    act(() => {
      probeValue?.replaceSlideElements('slide-1', [pushedElement]);
    });

    workbenchMode = 'overlay-editor';
    view.rerender(
      <SlideEditorProvider>
        <Probe />
      </SlideEditorProvider>,
    );

    await waitFor(() => {
      expect(updateElement).toHaveBeenCalledWith({
        id: 'element-1',
        x: 240,
        y: 100,
        width: 600,
        height: 120,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        layer: 'content',
        payload: pushedElement.payload,
      });
    });
  });
});
