import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Slide, SlideElement, TextElementPayload } from '@core/types';
import { ElementProvider, useElements } from './element-context';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useOverlayEditor } from './overlay-editor-context';
import { useSlideEditor } from './slide-editor-context';
import { useSlides } from './slide-context';
import { useTemplateEditor } from './template-editor-context';
import { useWorkbench } from './workbench-context';
import { useElementCommands } from './use-element-commands';
import { useElementHistory } from './use-element-history';
import { useElementInspectorSync } from './use-element-inspector-sync';
import { useElementSelection } from './use-element-selection';

vi.mock('./cast-context', () => ({
  useCast: vi.fn(),
}));

vi.mock('./navigation-context', () => ({
  useNavigation: vi.fn(),
}));

vi.mock('./overlay-editor-context', () => ({
  useOverlayEditor: vi.fn(),
}));

vi.mock('./slide-editor-context', () => ({
  useSlideEditor: vi.fn(),
}));

vi.mock('./slide-context', () => ({
  useSlides: vi.fn(),
}));

vi.mock('./template-editor-context', () => ({
  useTemplateEditor: vi.fn(),
}));

vi.mock('./workbench-context', () => ({
  useWorkbench: vi.fn(),
}));

vi.mock('./use-element-commands', () => ({
  useElementCommands: vi.fn(),
}));

vi.mock('./use-element-history', () => ({
  useElementHistory: vi.fn(),
}));

vi.mock('./use-element-inspector-sync', () => ({
  useElementInspectorSync: vi.fn(),
}));

vi.mock('./use-element-selection', () => ({
  useElementSelection: vi.fn(),
}));

let probeValue: ReturnType<typeof useElements> | null = null;

function Probe() {
  probeValue = useElements();
  return null;
}

function createSlide(id: string): Slide {
  return {
    id,
    presentationId: 'presentation-1',
    width: 1920,
    height: 1080,
    notes: '',
    order: 0,
    createdAt: '',
    updatedAt: '',
  };
}

function createTextElement(slideId: string, text: string): SlideElement {
  const payload: TextElementPayload = {
    text,
    fontFamily: 'Avenir Next',
    fontSize: 72,
    color: '#FFFFFF',
    alignment: 'center',
    weight: '700',
  };

  return {
    id: `element-${slideId}`,
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
    payload,
    createdAt: '',
    updatedAt: '',
  };
}

describe('ElementProvider', () => {
  const replaceSlideElements = vi.fn();
  let currentSlide: Slide | null = null;
  let slideElementsById = new Map<string, SlideElement[]>();

  beforeEach(() => {
    vi.clearAllMocks();
    probeValue = null;
    currentSlide = createSlide('slide-1');
    slideElementsById = new Map([
      ['slide-1', [createTextElement('slide-1', 'Layout line one')]],
      ['slide-2', [createTextElement('slide-2', 'Second slide')]],
    ]);

    vi.mocked(useCast).mockReturnValue({
      mutate: vi.fn(),
      setStatusText: vi.fn(),
    } as unknown as ReturnType<typeof useCast>);
    vi.mocked(useNavigation).mockReturnValue({
      currentPresentation: {
        id: 'presentation-1',
        title: 'Presentation',
        kind: 'canvas',
        entityType: 'presentation',
        createdAt: '',
        updatedAt: '',
      },
    } as unknown as ReturnType<typeof useNavigation>);
    vi.mocked(useOverlayEditor).mockReturnValue({
      currentOverlay: null,
      updateOverlayDraft: vi.fn(),
    } as unknown as ReturnType<typeof useOverlayEditor>);
    vi.mocked(useSlideEditor).mockReturnValue({
      getSlideElements: (slideId: string) => slideElementsById.get(slideId) ?? [],
      replaceSlideElements,
    } as unknown as ReturnType<typeof useSlideEditor>);
    vi.mocked(useSlides).mockImplementation(() => ({
      currentSlide,
    } as ReturnType<typeof useSlides>));
    vi.mocked(useTemplateEditor).mockReturnValue({
      currentTemplate: null,
      replaceTemplateElements: vi.fn(),
    } as unknown as ReturnType<typeof useTemplateEditor>);
    vi.mocked(useWorkbench).mockReturnValue({
      workbenchMode: 'slide-editor',
    } as unknown as ReturnType<typeof useWorkbench>);
    vi.mocked(useElementCommands).mockReturnValue({
      createText: vi.fn(),
      createShape: vi.fn(),
      createFromMedia: vi.fn(),
      createOverlay: vi.fn(),
      toggleOverlay: vi.fn(),
      importMedia: vi.fn(),
      deleteMedia: vi.fn(),
      changeMediaSrc: vi.fn(),
    });
    vi.mocked(useElementHistory).mockReturnValue({
      commitElementUpdates: vi.fn(),
      pushHistorySnapshot: vi.fn(),
      copySelection: vi.fn(),
      pasteSelection: vi.fn(),
      nudgeSelection: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    });
    vi.mocked(useElementInspectorSync).mockReturnValue({
      elementDraft: null,
      elementPayloadDraft: null,
      lockAspectRatio: false,
      setElementDraft: vi.fn(),
      setElementPayloadDraft: vi.fn(),
      setLockAspectRatio: vi.fn(),
    });
    vi.mocked(useElementSelection).mockReturnValue({
      primarySelectedElementId: null,
      selectedElementIds: [],
      selectedElement: null,
      selectElement: vi.fn(),
      selectElements: vi.fn(),
      toggleElementSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
  });

  it('stages the current effective slide elements before switching to another slide', () => {
    const view = render(
      <ElementProvider>
        <Probe />
      </ElementProvider>,
    );

    if (!probeValue) throw new Error('Expected element context');

    act(() => {
      probeValue?.setDraftElements({
        'element-slide-1': {
          payload: {
            ...(slideElementsById.get('slide-1')?.[0]?.payload as TextElementPayload),
            text: 'Updated lyric line',
          },
        },
      });
    });

    currentSlide = createSlide('slide-2');
    view.rerender(
      <ElementProvider>
        <Probe />
      </ElementProvider>,
    );

    expect(replaceSlideElements).toHaveBeenCalledWith('slide-1', [
      expect.objectContaining({
        id: 'element-slide-1',
        slideId: 'slide-1',
        payload: expect.objectContaining({
          text: 'Updated lyric line',
        }),
      }),
    ]);
  });
});
