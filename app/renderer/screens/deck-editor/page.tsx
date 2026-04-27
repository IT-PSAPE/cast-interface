import { Play, Plus } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { RecastPanel } from '@renderer/components 2.0/panel';
import type { Id } from '@core/types';
import { ContextMenu, useContextMenuTrigger } from '../../components/overlays/context-menu';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { Dropdown } from '../../components/form/dropdown';
import { FieldTextarea } from '../../components/form/field';
import { useElements, useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useCreateDeckItem } from '../../features/deck/create-deck-item';
import { useNavigation } from '../../contexts/navigation-context';
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
  const { currentDeckItem } = useNavigation();
  const { open: openCreateDeckItem } = useCreateDeckItem();
  const { effectiveElements } = useElements();
  const { getSlideElements } = useDeckEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide } = useSlides();
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

  useEditorLeftPanelNav({
    items: slides,
    currentId: currentSlide?.id ?? null,
    activate: (_id, index) => setCurrentSlideIndex(index),
  });

  function handleAddSlide() {
    void createSlide();
  }

  return (
    <section data-ui-region="deck-editor-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="edit-main" orientation="horizontal" className="h-full">
        {/* LEFT PANEL: LAYERS PANEL */}
        <SplitPanel.Segment id="edit-left" defaultSize={280} minSize={140} collapsible>
          <RecastPanel.Root className="h-full border-r border-secondary">
            <SplitPanel.Panel splitId={'slide-list-panel'} orientation="vertical" className="h-full">
              <SplitPanel.Segment id={'slide-list'} defaultSize={440} minSize={180}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {currentDeckItem ? <DeckItemIcon entity={currentDeckItem} className="shrink-0 text-tertiary" /> : null}
                      <span className="truncate text-sm font-medium text-primary" title={currentDeckItem?.title ?? 'No item selected'}>
                        {currentDeckItem?.title ?? 'No item selected'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Dropdown>
                        <Dropdown.Trigger
                          aria-label="Add"
                          className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary [&>svg]:size-4"
                        >
                          <Plus />
                        </Dropdown.Trigger>
                        <Dropdown.Panel placement="bottom-end">
                          <Dropdown.Item onClick={() => openCreateDeckItem('lyric')}>New lyric</Dropdown.Item>
                          <Dropdown.Item onClick={() => openCreateDeckItem('presentation')}>New presentation</Dropdown.Item>
                          <Dropdown.Separator />
                          <Dropdown.Item onClick={handleAddSlide} disabled={!currentDeckItem}>New slide</Dropdown.Item>
                        </Dropdown.Panel>
                      </Dropdown>
                    </div>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content className="min-h-0">
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
                    <ScrollArea.Root>
                      <ScrollArea.Viewport className="p-2">
                        <div className="grid min-w-0 grid-cols-1 content-start gap-3" role="grid" aria-label={`Current ${currentDeckItem?.type === 'lyric' ? 'lyrics' : 'slides'}`}>
                          {slides.map((slide, index) => {
                            const elements = currentSlide?.id === slide.id ? effectiveElements : getSlideElements(slide.id);
                            const scene = getThumbnailScene(slide.id, 'deck-editor');
                            if (!scene) return null;
                            const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

                            function handleSelect() {
                              setCurrentSlideIndex(index);
                            }

                            return (
                              <SlideTile
                                key={slide.id}
                                slideId={slide.id}
                                scene={scene}
                                index={index}
                                isActive={index === currentSlideIndex}
                                isLive={state === 'live'}
                                isEmpty={state === 'warning'}
                                textPreview={slideTextPreview(elements)}
                                onSelect={handleSelect}
                              />
                            );
                          })}
                        </div>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar>
                        <ScrollArea.Thumb />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  )}
                  </RecastPanel.Content>
                </RecastPanel.Group>
              </SplitPanel.Segment>
              <SplitPanel.Segment id={"slide-objects"} defaultSize={220} minSize={160}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle className="border-t">
                    <Label.xs className="mr-auto">Objects</Label.xs>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content className="overflow-y-auto p-2">
                    <ObjectListPanel />
                  </RecastPanel.Content>
                </RecastPanel.Group>
              </SplitPanel.Segment>
            </SplitPanel.Panel>
          </RecastPanel.Root>
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
                    <ReacstButton onClick={handleResetNotes} disabled={!hasSlide || !isDirty} variant="ghost">
                      Reset
                    </ReacstButton>
                    <ReacstButton onClick={handleSaveNotes} disabled={!canEdit || !isDirty}>
                      Save
                    </ReacstButton>
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
          <RecastPanel.Root className="h-full border-l border-secondary" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {inspectorState.isVisible && (
              <RecastPanel.Footer className="p-3">
                <ReacstButton onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </ReacstButton>
              </RecastPanel.Footer>
            )}
          </RecastPanel.Root>
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}

interface SlideTileProps {
  slideId: Id;
  scene: RenderScene;
  index: number;
  isActive: boolean;
  isLive: boolean;
  isEmpty: boolean;
  textPreview: string;
  onSelect: () => void;
}

function SlideTile({ slideId, scene, index, isActive, isLive, isEmpty, textPreview, onSelect }: SlideTileProps) {
  return (
    <ContextMenu.Root>
      <SlideTileBody
        slideId={slideId}
        scene={scene}
        index={index}
        isActive={isActive}
        isLive={isLive}
        isEmpty={isEmpty}
        textPreview={textPreview}
        onSelect={onSelect}
      />
    </ContextMenu.Root>
  );
}

function SlideTileBody({ slideId, scene, index, isActive, isLive, isEmpty, textPreview, onSelect }: SlideTileProps) {
  const { slides, duplicateSlide, deleteSlide, moveSlide } = useSlides();
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;
  const activeRef = useScrollAreaActiveItem<HTMLDivElement>(isActive);
  const { ref: triggerRef, ...triggerHandlers } = useContextMenuTrigger();

  return (
    <>
      <Thumbnail.Tile
        {...triggerHandlers}
        ref={(node) => {
          activeRef.current = node;
          triggerRef(node);
        }}
        onClick={onSelect}
        onDoubleClick={onSelect}
        selected={isActive}
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
        <Thumbnail.Caption>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
            <span className="min-w-0 truncate text-sm text-tertiary">{textPreview}</span>
          </div>
        </Thumbnail.Caption>
      </Thumbnail.Tile>
      <ContextMenu.Portal>
        <ContextMenu.Menu>
          <ContextMenu.Item onSelect={() => { void duplicateSlide(slideId); }}>Duplicate</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => { void deleteSlide(slideId); }}>Delete</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item disabled={isFirst} onSelect={() => { void moveSlide(slideId, 'up'); }}>Move up</ContextMenu.Item>
          <ContextMenu.Item disabled={isLast} onSelect={() => { void moveSlide(slideId, 'down'); }}>Move down</ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Portal>
    </>
  );
}
