import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSnapshot, Slide, SlideElement } from '@core/types';
import { SlideEditorProvider, useSlideEditor } from './slide-editor-context';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';
import { useSlides } from './slide-context';
import { useWorkbench } from './workbench-context';

vi.mock('./cast-context', () => ({
  useCast: vi.fn(),
}));

vi.mock('./use-project-content', () => ({
  useProjectContent: vi.fn(),
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

function createSnapshot(slideElements: SlideElement[]): AppSnapshot {
  return {
    libraries: [{
      id: 'library-1',
      name: 'Library',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    libraryBundles: [{
      library: {
        id: 'library-1',
        name: 'Library',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      playlists: [],
    }],
    presentations: [{
      id: 'presentation-1',
      title: 'Presentation',
      entityType: 'presentation',
      kind: 'canvas',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    slides: [createSlide()],
    slideElements,
    mediaAssets: [],
    overlays: [],
    templates: [],
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

  let workbenchMode: 'show' | 'slide-editor' | 'overlay-editor';

  beforeEach(() => {
    vi.clearAllMocks();
    probeValue = null;
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
      snapshot: createSnapshot([createElement()]),
      statusText: 'Ready',
      setStatusText,
      mutate,
    });
    vi.mocked(useProjectContent).mockReturnValue({
      presentations: [],
      slides: [createSlide()],
      slideElements: [createElement()],
      mediaAssets: [],
      overlays: [],
      templates: [],
      presentationsById: new Map(),
      slidesByPresentationId: new Map([['presentation-1', [createSlide()]]]),
      slideElementsBySlideId: new Map([['slide-1', [createElement()]]]),
      mediaAssetsById: new Map(),
      overlaysById: new Map(),
      templatesById: new Map(),
    });
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
