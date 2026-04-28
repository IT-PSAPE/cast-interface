import { useMemo, type ReactNode } from 'react';
import type { DeckItemType, Id } from '@core/types';
import { useElements, useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useCreateDeckItem } from '../../features/deck/create-deck-item';
import { useNavigation } from '../../contexts/navigation-context';
import { useDeckEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useSlides } from '../../contexts/slide-context';
import { useInspectorPanelPushAction } from '../../features/canvas/use-inspector-panel-push-action';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { useSlideNotesPanel } from '../../features/deck/use-slide-notes-panel';
import { createScreenContext } from '../../contexts/create-screen-context';

interface DeckEditorScreenContextValue {
  meta: {
    screenId: 'deck-editor';
    listTitle: 'Slides';
    addActions: Array<{
      id: 'new-lyric' | 'new-presentation' | 'new-slide';
      label: string;
      disabled?: boolean;
      kind?: DeckItemType;
    }>;
  };
  state: {
    currentDeckItem: ReturnType<typeof useNavigation>['currentDeckItem'];
    currentDeckItemId: ReturnType<typeof useNavigation>['currentDeckItemId'];
    deckItems: ReturnType<typeof useProjectContent>['deckItems'];
    slides: ReturnType<typeof useSlides>['slides'];
    currentSlide: ReturnType<typeof useSlides>['currentSlide'];
    currentSlideIndex: ReturnType<typeof useSlides>['currentSlideIndex'];
    liveSlideIndex: ReturnType<typeof useSlides>['liveSlideIndex'];
    effectiveElements: ReturnType<typeof useElements>['effectiveElements'];
    inspectorState: ReturnType<typeof useInspectorPanelPushAction>['state'];
    notesPanel: ReturnType<typeof useSlideNotesPanel>;
  };
  actions: {
    openCreateDeckItem: (kind: DeckItemType) => void;
    browseDeckItem: (id: Id) => void;
    setCurrentSlideIndex: (index: number) => void;
    createSlide: () => Promise<void>;
    duplicateSlide: ReturnType<typeof useSlides>['duplicateSlide'];
    deleteSlide: ReturnType<typeof useSlides>['deleteSlide'];
    moveSlide: ReturnType<typeof useSlides>['moveSlide'];
    pushChanges: () => void;
    getSlideElements: ReturnType<typeof useDeckEditor>['getSlideElements'];
    getThumbnailScene: ReturnType<typeof useRenderScenes>['getThumbnailScene'];
  };
}

const [DeckEditorScreenContextProvider, useDeckEditorScreen] = createScreenContext<DeckEditorScreenContextValue>('DeckEditorScreenContext');

export function DeckEditorScreenProvider({ children }: { children: ReactNode }) {
  const { currentDeckItem, currentDeckItemId, browseDeckItem } = useNavigation();
  const { open: openCreateDeckItem } = useCreateDeckItem();
  const { effectiveElements } = useElements();
  const { getSlideElements } = useDeckEditor();
  const {
    slides,
    currentSlide,
    currentSlideIndex,
    liveSlideIndex,
    setCurrentSlideIndex,
    createSlide,
    duplicateSlide,
    deleteSlide,
    moveSlide,
  } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const notesPanel = useSlideNotesPanel();
  const { deckItems } = useProjectContent();

  useEditorLeftPanelNav({
    items: slides,
    currentId: currentSlide?.id ?? null,
    activate: (_id, index) => setCurrentSlideIndex(index),
  });

  const addActions = useMemo<DeckEditorScreenContextValue['meta']['addActions']>(() => ([
    { id: 'new-lyric', label: 'New lyric', kind: 'lyric' },
    { id: 'new-presentation', label: 'New presentation', kind: 'presentation' },
    { id: 'new-slide', label: 'New slide', disabled: !currentDeckItem },
  ]), [currentDeckItem]);

  const value = useMemo<DeckEditorScreenContextValue>(() => ({
    meta: {
      screenId: 'deck-editor',
      listTitle: 'Slides',
      addActions,
    },
    state: {
      currentDeckItem,
      currentDeckItemId,
      deckItems,
      slides,
      currentSlide,
      currentSlideIndex,
      liveSlideIndex,
      effectiveElements,
      inspectorState,
      notesPanel,
    },
    actions: {
      openCreateDeckItem,
      browseDeckItem,
      setCurrentSlideIndex,
      createSlide,
      duplicateSlide,
      deleteSlide,
      moveSlide,
      pushChanges: handlePushChanges,
      getSlideElements,
      getThumbnailScene,
    },
  }), [
    addActions,
    browseDeckItem,
    createSlide,
    currentDeckItem,
    currentDeckItemId,
    currentSlide,
    currentSlideIndex,
    deckItems,
    deleteSlide,
    duplicateSlide,
    effectiveElements,
    getSlideElements,
    getThumbnailScene,
    handlePushChanges,
    inspectorState,
    liveSlideIndex,
    moveSlide,
    notesPanel,
    openCreateDeckItem,
    setCurrentSlideIndex,
    slides,
  ]);

  return <DeckEditorScreenContextProvider value={value}>{children}</DeckEditorScreenContextProvider>;
}

export { useDeckEditorScreen };
