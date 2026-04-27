import type { Id } from '@core/types';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Copy, FilePlus, Play, Plus, Trash2 } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { FieldTextarea } from '../../components/form/field';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { useCreateMenu } from '../../hooks/use-create-menu';
import { useElements, useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useDeckEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useSlides } from '../../contexts/slide-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import { CreateLyricDialog } from '../../features/deck/create-lyric-dialog';
import { LyricEditorModal } from '../../features/deck/lyric-editor-modal';
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

type CreateDeckItemAction = 'presentation' | 'lyric-edit' | 'lyric-empty';

export function DeckEditorScreen() {
  const { browseDeckItem, currentDeckItem, createPresentation, createEmptyLyric } = useNavigation();
  const { effectiveElements } = useElements();
  const { deckItems } = useProjectContent();
  const { getSlideElements } = useDeckEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide, deleteSlide, duplicateSlide, moveSlide } = useSlides();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { getThumbnailScene } = useRenderScenes();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const [activeCreateAction, setActiveCreateAction] = useState<CreateDeckItemAction | null>(null);
  const [isCreateLyricDialogOpen, setIsCreateLyricDialogOpen] = useState(false);
  const [isLyricEditorOpen, setIsLyricEditorOpen] = useState(false);
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

  function handleOpenCreateLyricDialog() {
    closeCreateMenu();
    setIsCreateLyricDialogOpen(true);
  }

  async function handleCreatePresentation() {
    setActiveCreateAction('presentation');
    try {
      await createPresentation();
      setWorkbenchMode('deck-editor');
    } finally {
      setActiveCreateAction(null);
    }
  }

  async function handleCreateEmptyLyricFromDialog() {
    setActiveCreateAction('lyric-empty');
    try {
      await createEmptyLyric();
      setIsCreateLyricDialogOpen(false);
      setWorkbenchMode('deck-editor');
    } finally {
      setActiveCreateAction(null);
    }
  }

  async function handleCreateEditableLyricFromDialog() {
    setActiveCreateAction('lyric-edit');
    try {
      await createEmptyLyric();
      setIsCreateLyricDialogOpen(false);
      setIsLyricEditorOpen(true);
    } finally {
      setActiveCreateAction(null);
    }
  }

  function handleCloseCreateLyricDialog() {
    if (activeCreateAction) return;
    setIsCreateLyricDialogOpen(false);
  }

  function handleCloseLyricEditor() {
    setIsLyricEditorOpen(false);
  }

  const {
    menuItems: createMenuItems,
    menuState: createMenuState,
    openMenuFromButton: openCreateMenuFromButton,
    closeMenu: closeCreateMenu,
  } = useCreateMenu(
    () => [
      {
        id: 'create-presentation',
        label: 'Presentation',
        icon: <DeckItemIcon entity="presentation" size={14} strokeWidth={1.75} />,
        onSelect: () => { void handleCreatePresentation(); },
      },
      {
        id: 'create-lyric',
        label: 'Lyric',
        icon: <DeckItemIcon entity="lyric" size={14} strokeWidth={1.75} />,
        onSelect: handleOpenCreateLyricDialog,
      },
    ],
    [createPresentation],
  );

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openCreateMenuFromButton(event.currentTarget);
  }

  function handleCreateMenuOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    closeCreateMenu();
  }

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
      <ContextMenu.ButtonTrigger className="flex w-full min-w-0">
        <ReacstButton variant="ghost" className="flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden px-0 text-left hover:bg-transparent">
          <span className="flex min-w-0 items-center gap-2">
            {currentDeckItem && <DeckItemIcon entity={currentDeckItem} className="shrink-0 text-tertiary" />}
            <span className="truncate text-sm font-medium text-primary" title={currentDeckItem?.title ?? 'No item selected'}>
              {currentDeckItem?.title ?? 'No item selected'}
            </span>
          </span>
          <ChevronsUpDown size={14} strokeWidth={1.5} className="shrink-0 text-tertiary" />
        </ReacstButton>
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
          <RecastPanel.Root className="h-full border-r border-secondary">
            <SplitPanel.Panel splitId={'slide-list-panel'} orientation="vertical" className="h-full">
              <SplitPanel.Segment id={'slide-list'} defaultSize={440} minSize={180}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle>
                    <div className="min-w-0 flex-1">{titleElement}</div>
                    <div className="flex gap-1">
                      <ReacstButton.Icon label={`Add ${currentDeckItem?.type === 'lyric' ? 'lyric' : 'slide'}`} onClick={handleAddSlide}>
                        <Plus />
                      </ReacstButton.Icon>
                      <ReacstButton.Icon label="Create deck item" onClick={handleOpenCreateMenu}>
                        <FilePlus />
                      </ReacstButton.Icon>
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
                    <ScrollArea className="p-2">
                      <div className="grid min-w-0 grid-cols-1 content-start gap-3" role="grid" aria-label={`Current ${currentDeckItem?.type === 'lyric' ? 'lyrics' : 'slides'}`}>
                        {slides.map((slide, index) => {
                          const elements = currentSlide?.id === slide.id ? effectiveElements : getSlideElements(slide.id);
                          const scene = getThumbnailScene(slide.id, 'deck-editor');
                          if (!scene) return null;
                          const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

                          function handleSelect() {
                            setCurrentSlideIndex(index);
                          }

                          function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
                            slideMenu.openFromEvent(event, slide.id);
                          }

                          return (
                            <SlideTile
                              key={slide.id}
                              scene={scene}
                              index={index}
                              isActive={index === currentSlideIndex}
                              isLive={state === 'live'}
                              isEmpty={state === 'warning'}
                              textPreview={slideTextPreview(elements)}
                              onSelect={handleSelect}
                              onContextMenu={handleContextMenu}
                            />
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                  </RecastPanel.Content>
                </RecastPanel.Group>
              </SplitPanel.Segment>
              <SplitPanel.Segment id={"slide-objects"} defaultSize={220} minSize={160}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle className="border-t">
                    <div className="mr-auto">
                      <Label.xs>Objects</Label.xs>
                    </div>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content className="overflow-y-auto p-2">
                    <ObjectListPanel />
                  </RecastPanel.Content>
                </RecastPanel.Group>
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
            <ContextMenu.Root open={Boolean(createMenuState)} position={createMenuState} onOpenChange={handleCreateMenuOpenChange}>
              <ContextMenu.Portal>
                <ContextMenu.Positioner>
                  <ContextMenu.Popup>
                    <ContextMenu.Items items={createMenuItems} />
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.Root>
            <CreateLyricDialog
              isOpen={isCreateLyricDialogOpen}
              isBusy={activeCreateAction !== null}
              onClose={handleCloseCreateLyricDialog}
              onCreateEmptyLyric={handleCreateEmptyLyricFromDialog}
              onCreateEditableLyric={handleCreateEditableLyricFromDialog}
            />
            <LyricEditorModal isOpen={isLyricEditorOpen} onClose={handleCloseLyricEditor} />
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
  scene: RenderScene;
  index: number;
  isActive: boolean;
  isLive: boolean;
  isEmpty: boolean;
  textPreview: string;
  onSelect: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
}

function SlideTile({ scene, index, isActive, isLive, isEmpty, textPreview, onSelect, onContextMenu }: SlideTileProps) {
  const activeRef = useScrollAreaActiveItem(isActive);
  return (
    <Thumbnail.Tile
      ref={activeRef}
      onClick={onSelect}
      onDoubleClick={onSelect}
      onContextMenu={onContextMenu}
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
  );
}
