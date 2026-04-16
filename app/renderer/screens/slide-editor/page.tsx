import { useMemo, useState } from 'react';
import { ChevronsUpDown, Trash2 } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { Panel } from '../../components/layout/panel';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { FieldTextarea } from '../../components/form/field';
import { useElements } from '../../contexts/element/element-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useSlideEditor } from '../../contexts/slide-editor-context';
import { useSlides } from '../../contexts/slide-context';
import { getSlideVisualState } from '../../utils/slides';
import { ItemListPanel } from '../../features/editor/item-list-panel';
import { InspectorTabsPanel } from '../../features/inspector/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/inspector/use-inspector-panel-push-action';
import { StagePanel } from '../../features/stage/stage-panel';
import { useRenderScenes } from '../../features/stage/render-scene-provider';
import { PanelRoute } from '../../features/workbench/panel-route';
import { SlideCard } from '../../features/show/slide-card';
import { useSlideNotesPanel } from '../../features/editor/use-slide-notes-panel';

interface SlideMenuState {
  x: number;
  y: number;
  slideId: string;
}

export function SlideEditorScreen() {
  const { browseDeckItem, currentDeckItem } = useNavigation();
  const { effectiveElements } = useElements();
  const { deckItems } = useProjectContent();
  const { getSlideElements } = useSlideEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide, deleteSlide } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const {
    canEdit,
    notesDraft,
    isDirty,
    hasSlide,
    placeholder,
    handleNotesChange,
    handleSaveNotes,
    handleResetNotes,
  } = useSlideNotesPanel();
  const [presentationMenuPosition, setPresentationMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [slideMenuState, setSlideMenuState] = useState<SlideMenuState | null>(null);

  const presentationMenuItems = useMemo<ContextMenuItem[]>(() => {
    return deckItems.map((item) => ({
      id: item.id,
      label: item.title,
      icon: <DeckItemIcon entity={item} className="text-tertiary" />,
      onSelect: () => browseDeckItem(item.id),
    }));
  }, [browseDeckItem, deckItems]);

  function handleAddSlide() {
    void createSlide();
  }

  function handleOpenPresentationMenu(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPresentationMenuPosition({ x: rect.left, y: rect.bottom + 4 });
  }

  function handleDeleteSlide(slideId: string) {
    if (!window.confirm('Delete this slide? This cannot be undone.')) return;
    void deleteSlide(slideId);
  }

  const slideMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!slideMenuState) return [];
    return [
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteSlide(slideMenuState.slideId) },
    ];
  }, [slideMenuState]);

  const titleElement = (
    <Button variant="ghost" onClick={handleOpenPresentationMenu} className="flex w-full items-center justify-between gap-2 overflow-hidden px-0 text-left hover:bg-transparent">
      <span className="flex min-w-0 items-center gap-2">
        {currentDeckItem ? <DeckItemIcon entity={currentDeckItem} className="shrink-0 text-tertiary" /> : null}
        <span className="truncate text-sm font-medium text-primary" title={currentDeckItem?.title ?? 'No item selected'}>
          {currentDeckItem?.title ?? 'No item selected'}
        </span>
      </span>
      <ChevronsUpDown size={14} strokeWidth={1.5} className="shrink-0 text-tertiary" />
    </Button>
  );

  const contextMenus = (
    <>
      {presentationMenuPosition ? (
        <ContextMenu x={presentationMenuPosition.x} y={presentationMenuPosition.y} items={presentationMenuItems} onClose={() => setPresentationMenuPosition(null)} />
      ) : null}
      {slideMenuState ? <ContextMenu x={slideMenuState.x} y={slideMenuState.y} items={slideMenuItems} onClose={() => setSlideMenuState(null)} /> : null}
    </>
  );

  return (
    <section data-ui-region="slide-editor-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="edit-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="edit-left" defaultSize={280} minSize={140} collapsible>
          <ItemListPanel
            title={titleElement}
            splitId="slide-list-panel"
            listPanelId="slide-list"
            objectsPanelId="slide-objects"
            onAdd={handleAddSlide}
            addLabel={`Add ${currentDeckItem?.type === 'lyric' ? 'lyric' : 'slide'}`}
            listAriaLabel={`Current ${currentDeckItem?.type === 'lyric' ? 'lyrics' : 'slides'}`}
            contextMenu={contextMenus}
          >
            {slides.map((slide, index) => {
              const elements = currentSlide?.id === slide.id ? effectiveElements : getSlideElements(slide.id);
              const scene = getThumbnailScene(slide.id, 'slide-editor');
              if (!scene) return null;
              const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

              function handleSelect() {
                setCurrentSlideIndex(index);
              }

              function handleContextMenu(event: React.MouseEvent) {
                event.preventDefault();
                setSlideMenuState({ x: event.clientX, y: event.clientY, slideId: slide.id });
              }

              return (
                <div key={slide.id} onContextMenu={handleContextMenu}>
                  <SlideCard
                    index={index}
                    state={state}
                    scene={scene}
                    elements={elements}
                    isFocused={index === currentSlideIndex}
                    onActivate={handleSelect}
                    onEdit={handleSelect}
                  />
                </div>
              );
            })}
          </ItemListPanel>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="edit-center" defaultSize={840} minSize={360}>
          <PanelRoute.Split splitId="edit-center" orientation="vertical" className="h-full">
            <PanelRoute.Panel id="edit-middle" defaultSize={620} minSize={240}>
              <StagePanel />
            </PanelRoute.Panel>
            <PanelRoute.Panel id="edit-bottom" defaultSize={220} minSize={120} collapsible>
              <section
                data-ui-region="slide-notes-panel"
                className="relative h-full min-h-0 overflow-hidden border-t border-primary bg-primary/70"
              >
                <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end">
                  <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-primary bg-primary/95 p-1 shadow-sm backdrop-blur-sm">
                    <Button onClick={handleResetNotes} disabled={!hasSlide || !isDirty} variant="ghost">
                      Reset
                    </Button>
                    <Button onClick={handleSaveNotes} disabled={!canEdit || !isDirty}>
                      Save
                    </Button>
                  </div>
                </div>
                <FieldTextarea
                  value={notesDraft}
                  onChange={handleNotesChange}
                  placeholder={placeholder}
                  className="h-full min-h-0 w-full resize-none rounded-none border-0 bg-transparent px-3 pb-3 pt-14 leading-relaxed focus:border-0"
                />
              </section>
            </PanelRoute.Panel>
          </PanelRoute.Split>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="edit-right" defaultSize={320} minSize={140} collapsible>
          <Panel as="aside" bordered="left" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {inspectorState.isVisible ? (
              <Panel.Footer className="p-3">
                <Button onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </Button>
              </Panel.Footer>
            ) : null}
          </Panel>
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </section>
  );
}
