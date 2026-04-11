import { useMemo, useState } from 'react';
import { Button } from '../../../components/controls/button';
import { ContextMenu, type ContextMenuItem } from '../../../components/overlays/context-menu';
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { Panel } from '../../../components/panel';
import { ContentItemIcon } from '../../../components/display/presentation-entity-icon';
import { useNavigation } from '../../../contexts/navigation-context';
import { useElements } from '../../../contexts/element/element-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlideEditor } from '../../../contexts/slide-editor-context';
import { useSlides } from '../../../contexts/slide-context';
import { getSlideVisualState } from '../../../utils/slides';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { PanelRoute } from '../../workbench/components/panel-route';
import { ObjectListPanel } from './object-list-panel';
import { SlideCard } from '../../show/slides/components/slide-card';

interface MenuState {
  x: number;
  y: number;
}

interface SlideMenuState extends MenuState {
  slideId: string;
}

export function SlideListPanel() {
  const { browseContentItem, currentContentItem } = useNavigation();
  const { effectiveElements } = useElements();
  const { contentItems } = useProjectContent();
  const { getSlideElements } = useSlideEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide, deleteSlide } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [slideMenuState, setSlideMenuState] = useState<SlideMenuState | null>(null);
  const itemLabel = currentContentItem?.type === 'lyric' ? 'Lyrics' : 'Slides';

  const presentationMenuItems = useMemo<ContextMenuItem[]>(() => {
    return contentItems.map((item) => ({
      id: item.id,
      label: item.title,
      icon: <ContentItemIcon entity={item} className="text-text-tertiary" />,
      onSelect: () => browseContentItem(item.id),
    }));
  }, [browseContentItem, contentItems]);

  function handleAddSlide() {
    void createSlide();
  }

  function handleOpenPresentationMenu(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({ x: rect.left, y: rect.bottom + 4 });
  }

  function handleClosePresentationMenu() {
    setMenuState(null);
  }

  function handleSlideContextMenu(event: React.MouseEvent, slideId: string) {
    event.preventDefault();
    setSlideMenuState({ x: event.clientX, y: event.clientY, slideId });
  }

  function handleCloseSlideMenu() {
    setSlideMenuState(null);
  }

  function handleDeleteSlide(slideId: string) {
    if (!window.confirm('Delete this slide? This cannot be undone.')) return;
    void deleteSlide(slideId);
  }

  const slideMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!slideMenuState) return [];
    return [
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        danger: true,
        onSelect: () => handleDeleteSlide(slideMenuState.slideId),
      },
    ];
  }, [slideMenuState]);

  function renderSlide(slide: (typeof slides)[number], index: number) {
    const elements = currentSlide?.id === slide.id
      ? effectiveElements
      : getSlideElements(slide.id);
    const scene = getThumbnailScene(slide.id, 'slide-editor');
    if (!scene) return null;
    const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

    function handleSelect() {
      setCurrentSlideIndex(index);
    }

    function handleContextMenu(event: React.MouseEvent) {
      handleSlideContextMenu(event, slide.id);
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
  }

  return (
    <Panel.Root as="aside" bordered="right" data-ui-region="slide-list-panel">
      <PanelRoute.Split splitId="slide-list-panel" orientation="vertical" className="h-full">
        <PanelRoute.Panel id="slide-list" defaultSize={440} minSize={180}>
          <Panel.Section
            title={(
              <Button.Root variant="ghost" onClick={handleOpenPresentationMenu} className="flex w-full items-center justify-between gap-2 overflow-hidden px-0 text-left hover:bg-transparent">
                <span className="flex min-w-0 items-center gap-2">
                  {currentContentItem ? <ContentItemIcon entity={currentContentItem} className="shrink-0 text-text-tertiary" /> : null}
                  <span className="truncate text-sm font-medium text-text-primary" title={currentContentItem?.title ?? 'No item selected'}>
                    {currentContentItem?.title ?? 'No item selected'}
                  </span>
                </span>
                <ChevronsUpDown size={14} strokeWidth={1.5} className="shrink-0 text-text-tertiary" />
              </Button.Root>
            )}
            action={(
              <Button.Icon label={`Add ${currentContentItem?.type === 'lyric' ? 'lyric' : 'slide'}`} size="sm" onClick={handleAddSlide}>
                <Plus size={14} strokeWidth={2} />
              </Button.Icon>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2" role="grid" aria-label={`Current ${itemLabel.toLowerCase()}`}>
              {slides.map(renderSlide)}
            </div>
          </Panel.Section>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="slide-objects" defaultSize={220} minSize={160}>
          <Panel.Section
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-t border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </Panel.Section>
        </PanelRoute.Panel>
      </PanelRoute.Split>
      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={presentationMenuItems} onClose={handleClosePresentationMenu} /> : null}
      {slideMenuState ? <ContextMenu x={slideMenuState.x} y={slideMenuState.y} items={slideMenuItems} onClose={handleCloseSlideMenu} /> : null}
    </Panel.Root>
  );
}
