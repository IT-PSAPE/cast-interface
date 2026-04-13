import { useMemo, useState } from 'react';
import { Button } from '../../components/controls/button';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { ChevronsUpDown, Trash2 } from 'lucide-react';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { useNavigation } from '../../contexts/navigation-context';
import { useElements } from '../../contexts/element/element-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useSlideEditor } from '../../contexts/slide-editor-context';
import { useSlides } from '../../contexts/slide-context';
import { getSlideVisualState } from '../../utils/slides';
import { useRenderScenes } from '../stage/render-scene-provider';
import { SlideCard } from '../show/slide-card';
import { ItemListPanel } from './item-list-panel';

interface SlideMenuState {
  x: number;
  y: number;
  slideId: string;
}

export function SlideListPanel() {
  const { browseDeckItem, currentDeckItem } = useNavigation();
  const { effectiveElements } = useElements();
  const { deckItems } = useProjectContent();
  const { getSlideElements } = useSlideEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide, deleteSlide } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const [presMenuPos, setPresMenuPos] = useState<{ x: number; y: number } | null>(null);
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
    setPresMenuPos({ x: rect.left, y: rect.bottom + 4 });
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
      {presMenuPos ? <ContextMenu x={presMenuPos.x} y={presMenuPos.y} items={presentationMenuItems} onClose={() => setPresMenuPos(null)} /> : null}
      {slideMenuState ? <ContextMenu x={slideMenuState.x} y={slideMenuState.y} items={slideMenuItems} onClose={() => setSlideMenuState(null)} /> : null}
    </>
  );

  return (
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
  );
}
