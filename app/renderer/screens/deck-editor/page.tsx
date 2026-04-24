import type { Id } from '@core/types';
import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Copy, Ellipsis, Play, Plus, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../components/controls/button';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { Panel } from '../../components/layout/panel';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { FieldTextarea } from '../../components/form/field';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { useElements, useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useDeckEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useSlides } from '../../contexts/slide-context';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import { InspectorTabsPanel } from '../../features/canvas/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/canvas/use-inspector-panel-push-action';
import { StagePanel } from '../../features/canvas/stage-panel';
import { SplitPanel } from '../../features/workbench/split-panel';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { useSlideNotesPanel } from '../../features/deck/use-slide-notes-panel';
import { ObjectListPanel } from '@renderer/features/canvas/object-list-panel';
import { Thumbnail } from '@renderer/components/display/thumbnail';
import { SceneFrame } from '@renderer/components/display/scene-frame';
import { SceneStage } from '@renderer/features/canvas/scene-stage';
import type { RenderScene } from '@renderer/features/canvas/scene-types';
import { EmptyState } from '@renderer/components/display/empty-state';
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';
import { Label } from '@renderer/components/display/text';

export function DeckEditorScreen() {
  const { browseDeckItem, currentDeckItem } = useNavigation();
  const { effectiveElements } = useElements();
  const { deckItems } = useProjectContent();
  const { getSlideElements } = useDeckEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide, deleteSlide, duplicateSlide, moveSlide, reorderSlide } = useSlides();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
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
  const slideMenu = useContextMenuState<Id>();

  useEditorLeftPanelNav({
    items: slides,
    currentId: currentSlide?.id ?? null,
    activate: (_id, index) => setCurrentSlideIndex(index),
  });

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

  function handleDeleteSlide(slideId: string) {
    if (!window.confirm('Delete this slide? This cannot be undone.')) return;
    void deleteSlide(slideId);
  }

  function handleSlideDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newIndex = slides.findIndex((slide) => slide.id === over.id);
    if (newIndex < 0) return;
    void reorderSlide(String(active.id), newIndex);
  }

  function buildSlideMenuItems(slideId: Id): ContextMenuItem[] {
    const slideIndex = slides.findIndex((slide) => slide.id === slideId);
    const canMoveUp = slideIndex > 0;
    const canMoveDown = slideIndex >= 0 && slideIndex < slides.length - 1;
    return [
      { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} />, onSelect: () => void duplicateSlide(slideId) },
      { id: 'move-up', label: 'Move Up', icon: <ArrowUp size={14} />, disabled: !canMoveUp, onSelect: () => void moveSlide(slideId, 'up') },
      { id: 'move-down', label: 'Move Down', icon: <ArrowDown size={14} />, disabled: !canMoveDown, onSelect: () => void moveSlide(slideId, 'down') },
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteSlide(slideId) },
    ];
  }

  const titleElement = (
    <ContextMenu.Root>
      <ContextMenu.ButtonTrigger>
        <Button variant="ghost" className="flex w-full items-center justify-between gap-2 overflow-hidden px-0 text-left hover:bg-transparent">
          <span className="flex min-w-0 items-center gap-2">
            {currentDeckItem && <DeckItemIcon entity={currentDeckItem} className="shrink-0 text-tertiary" />}
            <span className="truncate text-sm font-medium text-primary" title={currentDeckItem?.title ?? 'No item selected'}>
              {currentDeckItem?.title ?? 'No item selected'}
            </span>
          </span>
          <ChevronsUpDown size={14} strokeWidth={1.5} className="shrink-0 text-tertiary" />
        </Button>
      </ContextMenu.ButtonTrigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Items items={presentationMenuItems} />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );

  const slideMenuItems = slideMenu.menuState ? buildSlideMenuItems(slideMenu.menuState.data) : [];

  function handleSlideMenuOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    slideMenu.close();
  }

  return (
    <section data-ui-region="deck-editor-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="edit-main" orientation="horizontal" className="h-full">
        {/* LEFT PANEL: LAYERS PANEL */}
        <SplitPanel.Segment id="edit-left" defaultSize={280} minSize={140} collapsible>
          <Panel as="aside" bordered="right">
            <SplitPanel.Panel splitId={'slide-list-panel'} orientation="vertical" className="h-full">
              <SplitPanel.Segment id={'slide-list'} defaultSize={440} minSize={180}>
                <Panel.Section>
                  <Panel.SectionHeader className="border-b border-primary">
                    <Panel.SectionTitle>{titleElement}</Panel.SectionTitle>
                    <Panel.SectionAction>
                      <Button.Icon label={`Add ${currentDeckItem?.type === 'lyric' ? 'lyric' : 'slide'}`} onClick={handleAddSlide}>
                        <Plus />
                      </Button.Icon>
                    </Panel.SectionAction>
                  </Panel.SectionHeader>
                  <Panel.SectionBody>
                  {!currentDeckItem ? (
                    <EmptyState.Root>
                      <EmptyState.Title>No item selected</EmptyState.Title>
                      <EmptyState.Description>Pick a presentation or lyric from the menu above to start editing.</EmptyState.Description>
                    </EmptyState.Root>
                  ) : slides.length === 0 ? (
                    <EmptyState.Root>
                      <EmptyState.Title>No slides yet</EmptyState.Title>
                      <EmptyState.Description>Click the + button to add your first slide.</EmptyState.Description>
                    </EmptyState.Root>
                  ) : (
                  <ScrollArea className="p-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSlideDragEnd}>
                    <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid min-w-0 grid-cols-1 content-start gap-3" role="grid" aria-label={`Current ${currentDeckItem?.type === 'lyric' ? 'lyrics' : 'slides'}`}>
                        {slides.map((slide, index) => {
                          const elements = currentSlide?.id === slide.id ? effectiveElements : getSlideElements(slide.id);
                          const scene = getThumbnailScene(slide.id, 'deck-editor');
                          if (!scene) return null;
                          const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

                          function handleSelect() {
                            setCurrentSlideIndex(index);
                          }

                          function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
                            event.stopPropagation();
                            slideMenu.openFromButton(event.currentTarget, slide.id);
                          }

                          return (
                            <SortableSlideTile
                              key={slide.id}
                              slide={slide}
                              scene={scene}
                              index={index}
                              isActive={index === currentSlideIndex}
                              isLive={state === 'live'}
                              isEmpty={state === 'warning'}
                              textPreview={slideTextPreview(elements)}
                              onSelect={handleSelect}
                              onMenuClick={handleMenuClick}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                  </ScrollArea>
                  )}
                  </Panel.SectionBody>
                </Panel.Section>
              </SplitPanel.Segment>
              <SplitPanel.Segment id={"slide-objects"} defaultSize={220} minSize={160}>
                <Panel.Section>
                  <Panel.SectionHeader className="border-b border-t border-primary">
                    <Panel.SectionTitle>
                      <Label.xs>Objects</Label.xs>
                    </Panel.SectionTitle>
                  </Panel.SectionHeader>
                  <Panel.SectionBody className="overflow-y-auto p-2">
                    <ObjectListPanel />
                  </Panel.SectionBody>
                </Panel.Section>
              </SplitPanel.Segment>
            </SplitPanel.Panel>
            <ContextMenu.Root open={Boolean(slideMenu.menuState)} position={slideMenu.menuState} onOpenChange={handleSlideMenuOpenChange}>
              <ContextMenu.Portal>
                <ContextMenu.Positioner>
                  <ContextMenu.Popup>
                    <ContextMenu.Items items={slideMenuItems} />
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          </Panel>
        </SplitPanel.Segment>

        {/* CENTER PANEL: CANVAS & NOTES PANEL */}
        <SplitPanel.Segment id="edit-center" defaultSize={840} minSize={360}>
          <SplitPanel.Panel splitId="edit-center" orientation="vertical" className="h-full">
            <SplitPanel.Segment id="edit-middle" defaultSize={620} minSize={240}>
              <StagePanel />
            </SplitPanel.Segment>
            <SplitPanel.Segment id="edit-bottom" defaultSize={220} minSize={120} collapsible>
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
            </SplitPanel.Segment>
          </SplitPanel.Panel>
        </SplitPanel.Segment>

        {/* RIGHT PANEL: INSPECTOR PANEL*/}
        <SplitPanel.Segment id="edit-right" defaultSize={320} minSize={140} collapsible>
          <Panel as="aside" bordered="left" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {inspectorState.isVisible && (
              <Panel.Footer className="p-3">
                <Button onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </Button>
              </Panel.Footer>
            )}
          </Panel>
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}

interface SortableSlideTileProps {
  slide: { id: Id };
  scene: RenderScene;
  index: number;
  isActive: boolean;
  isLive: boolean;
  isEmpty: boolean;
  textPreview: string;
  onSelect: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function SortableSlideTile({ slide, scene, index, isActive, isLive, isEmpty, textPreview, onSelect, onMenuClick }: SortableSlideTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const activeRef = useScrollAreaActiveItem(isActive);
  const setRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    activeRef.current = el;
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };
  return (
    <Thumbnail.Tile
      ref={setRef}
      style={style}
      onClick={onSelect}
      onDoubleClick={onSelect}
      selected={isActive}
      {...attributes}
      {...listeners}
    >
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          {isEmpty && (
            <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
              Empty
            </div>
          )}
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      </Thumbnail.Body>
      {isLive && (
        <Thumbnail.Overlay position="top-left">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] bg-brand_solid text-white shadow-sm">
            <Play size={12} strokeWidth={1.9} />
          </span>
        </Thumbnail.Overlay>
      )}
      <Thumbnail.Overlay position="top-right" className="hidden group-hover:block">
        <Button.Icon label="Slide options" onPointerDown={(event) => event.stopPropagation()} onClick={onMenuClick} className="border-primary bg-tertiary/80">
          <Ellipsis />
        </Button.Icon>
      </Thumbnail.Overlay>
      <Thumbnail.Caption>
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <span className="min-w-0 truncate text-sm text-tertiary">{textPreview}</span>
        </div>
      </Thumbnail.Caption>
    </Thumbnail.Tile>
  );
}
