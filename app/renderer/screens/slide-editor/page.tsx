import { useMemo, useState } from 'react';
import { ChevronsUpDown, Play, Plus, Trash2 } from 'lucide-react';
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
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import { InspectorTabsPanel } from '../../features/inspector/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/inspector/use-inspector-panel-push-action';
import { StagePanel } from '../../features/stage/stage-panel';
import { useRenderScenes } from '../../features/stage/render-scene-provider';
import { SplitPanel } from '../../features/workbench/split-panel';
import { useSlideNotesPanel } from '../../features/editor/use-slide-notes-panel';
import { ObjectListPanel } from '@renderer/features/editor/object-list-panel';
import { Thumbnail } from '@renderer/components/display/thumbnail';
import { SceneFrame } from '@renderer/components/display/scene-frame';
import { SceneStage } from '@renderer/features/stage/scene-stage';

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
                  <Panel.SectionBody className="overflow-y-auto p-2">
                  <div className="grid min-w-0 grid-cols-1 content-start gap-1" role="grid" aria-label={`Current ${currentDeckItem?.type === 'lyric' ? 'lyrics' : 'slides'}`}>
                    {slides.map((slide, index) => {
                      const elements = currentSlide?.id === slide.id ? effectiveElements : getSlideElements(slide.id);
                      const scene = getThumbnailScene(slide.id, 'slide-editor');
                      if (!scene) return null;
                      const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

                      function handleSelect() {
                        setCurrentSlideIndex(index);
                      }

                      const isLive = state === 'live';
                      const isEmpty = state === 'warning';

                      return (
                        <Thumbnail.Tile
                          onClick={handleSelect}
                          onDoubleClick={handleSelect}
                          selected={index === currentSlideIndex}
                        >
                          <Thumbnail.Body>
                            <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                              {isEmpty ? (
                                <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
                                  Empty
                                </div>
                              ) : null}
                              <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
                            </SceneFrame>
                          </Thumbnail.Body>
                          {isLive ? (
                            <Thumbnail.Overlay position="top-left">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] bg-brand_solid text-white shadow-sm">
                                <Play size={12} strokeWidth={1.9} />
                              </span>
                            </Thumbnail.Overlay>
                          ) : null}
                          <Thumbnail.Caption>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
                              <span className="min-w-0 truncate text-sm text-tertiary">{slideTextPreview(elements)}</span>
                            </div>
                          </Thumbnail.Caption>
                        </Thumbnail.Tile>
                      );
                    })}
                  </div>
                  </Panel.SectionBody>
                </Panel.Section>
              </SplitPanel.Segment>
              <SplitPanel.Segment id={"slide-objects"} defaultSize={220} minSize={160}>
                <Panel.Section>
                  <Panel.SectionHeader className="border-b border-t border-primary">
                    <Panel.SectionTitle>
                      <span className="text-sm font-medium text-primary">Objects</span>
                    </Panel.SectionTitle>
                  </Panel.SectionHeader>
                  <Panel.SectionBody className="overflow-y-auto p-2">
                    <ObjectListPanel />
                  </Panel.SectionBody>
                </Panel.Section>
              </SplitPanel.Segment>
            </SplitPanel.Panel>
            {contextMenus}
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
            {inspectorState.isVisible ? (
              <Panel.Footer className="p-3">
                <Button onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </Button>
              </Panel.Footer>
            ) : null}
          </Panel>
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}
