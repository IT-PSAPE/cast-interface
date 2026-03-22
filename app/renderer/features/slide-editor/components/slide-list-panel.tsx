import { useMemo, useState } from 'react';
import { Button } from '../../../components/button';
import { ContextMenu, type ContextMenuItem } from '../../../components/context-menu';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PanelSection } from '../../../components/panel-section';
import { PresentationEntityIcon } from '../../../components/presentation-entity-icon';
import { useNavigation } from '../../../contexts/navigation-context';
import { useElements } from '../../../contexts/element-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlideEditor } from '../../../contexts/slide-editor-context';
import { useSlides } from '../../../contexts/slide-context';
import { getSlideVisualState } from '../../../utils/slides';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { PanelRoute } from '../../workbench/components/panel-route';
import { ObjectListPanel } from './object-list-panel';
import { SlideCard } from '../../slide-browser/components/slide-card';

interface MenuState {
  x: number;
  y: number;
}

export function SlideListPanel() {
  const { browsePresentation, currentPresentation } = useNavigation();
  const { effectiveElements } = useElements();
  const { presentations } = useProjectContent();
  const { getSlideElements } = useSlideEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const itemLabel = currentPresentation?.entityType === 'lyric' ? 'Lyrics' : 'Slides';

  const presentationMenuItems = useMemo<ContextMenuItem[]>(() => {
    return presentations.map((presentation) => ({
      id: presentation.id,
      label: presentation.title,
      icon: <PresentationEntityIcon entity={presentation} className="text-text-tertiary" />,
      onSelect: () => browsePresentation(presentation.id),
    }));
  }, [browsePresentation, presentations]);

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

    return (
      <SlideCard
        key={slide.id}
        index={index}
        state={state}
        scene={scene}
        elements={elements}
        isFocused={index === currentSlideIndex}
        onActivate={handleSelect}
        onEdit={handleSelect}
      />
    );
  }

  return (
    <aside
      data-ui-region="slide-list-panel"
      className="h-full min-h-0 overflow-hidden border-r border-border-primary bg-primary"
    >
      <PanelRoute.Split splitId="slide-list-panel" orientation="vertical" className="h-full">
        <PanelRoute.Panel id="slide-list" defaultSize={440} minSize={180}>
          <PanelSection
            title={(
              <Button variant="ghost" onClick={handleOpenPresentationMenu} className="flex w-full items-center justify-between gap-2 overflow-hidden px-0 text-left hover:bg-transparent">
                <span className="flex min-w-0 items-center gap-2">
                  {currentPresentation ? <PresentationEntityIcon entity={currentPresentation} className="shrink-0 text-text-tertiary" /> : null}
                  <span className="truncate text-sm font-medium text-text-primary" title={currentPresentation?.title ?? 'No presentation selected'}>
                    {currentPresentation?.title ?? 'No presentation selected'}
                  </span>
                </span>
                <Icon.chevron_selector_vertical size={14} strokeWidth={1.5} className="shrink-0 text-text-tertiary" />
              </Button>
            )}
            action={(
              <IconButton label={`Add ${currentPresentation?.entityType === 'lyric' ? 'lyric' : 'slide'}`} size="sm" onClick={handleAddSlide}>
                <Icon.plus size={14} strokeWidth={2} />
              </IconButton>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2" role="grid" aria-label={`Current ${itemLabel.toLowerCase()}`}>
              {slides.map(renderSlide)}
            </div>
          </PanelSection>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="slide-objects" defaultSize={220} minSize={160}>
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-t border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        </PanelRoute.Panel>
      </PanelRoute.Split>
      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={presentationMenuItems} onClose={handleClosePresentationMenu} /> : null}
    </aside>
  );
}
