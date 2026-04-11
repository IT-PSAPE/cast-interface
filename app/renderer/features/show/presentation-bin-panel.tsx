import { useMemo } from 'react';
import type { ContentItem, Id, Slide } from '@core/types';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { Ellipsis } from 'lucide-react';
import { EditableText } from '../../components/form/editable-text';
import { Button } from '../../components/controls/button';
import { ContentItemIcon } from '../../components/display/presentation-entity-icon';
import { SceneFrame } from '../../components/display/scene-frame';
import { Thumbnail } from '../../components/display/thumbnail';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { buildContentItemMenuItems } from './build-presentation-menu-items';
import { useLibraryPanelManagement } from './use-library-panel-management';
import { buildThumbnailScene } from '../stage/build-render-scene';
import { SceneStage } from '../stage/scene-stage';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { filterByText } from '../../utils/filter-by-text';
import { useState } from 'react';

interface ContentBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function ContentBinPanel({ filterText, gridItemSize }: ContentBinPanelProps) {
  const {
    currentDrawerContentItemId,
    currentPlaylistId,
    currentLibraryBundle,
    browseContentItem,
    isDetachedContentBrowser,
  } = useNavigation();
  const { contentItems, slidesByContentItemId } = useProjectContent();
  const {
    renameContentItem,
    deleteContentItem,
    moveContentItem,
    moveContentItemToSegment,
  } = useLibraryPanelManagement();
  const menu = useContextMenuState<Id>();
  const [editingPresentationId, setEditingPresentationId] = useState<Id | null>(null);

  const filteredPresentations = useMemo(() => {
    return filterByText(contentItems, filterText, (item) => {
      const slides = slidesByContentItemId.get(item.id) ?? [];
      const slideLabels = slides.map((slide) => `slide ${slide.order + 1}`);
      return [item.title, item.type, ...slideLabels];
    });
  }, [contentItems, filterText, slidesByContentItemId]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu.menuState) return [];
    return buildContentItemMenuItems({
      itemId: menu.menuState.data,
      scope: 'library',
      currentPlaylistId,
      selectedTree: currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      itemIds: contentItems.map((item) => item.id),
      selectContentItem: browseContentItem,
      moveContentItem,
      moveContentItemToSegment,
      beginRenameContentItem: setEditingPresentationId,
      deleteContentItem,
    });
  }, [browseContentItem, contentItems, currentLibraryBundle, currentPlaylistId, deleteContentItem, menu.menuState, moveContentItem, moveContentItemToSegment]);

  function handleRename(itemId: Id, title: string) {
    void renameContentItem(itemId, title);
    setEditingPresentationId(null);
  }

  return (
    <>
      <ThumbnailGrid columns={gridItemSize}>
        {filteredPresentations.map((presentation) => (
          <ContentCard
            key={presentation.id}
            item={presentation}
            slides={slidesByContentItemId.get(presentation.id) ?? []}
            isSelected={isDetachedContentBrowser && currentDrawerContentItemId === presentation.id}
            isEditing={editingPresentationId === presentation.id}
            onOpen={browseContentItem}
            onOpenMenu={menu.openFromButton}
            onContextMenu={menu.openFromEvent}
            onRename={handleRename}
          />
        ))}
      </ThumbnailGrid>

      {menu.menuState ? (
        <ContextMenu
          x={menu.menuState.x}
          y={menu.menuState.y}
          items={menuItems}
          onClose={menu.close}
        />
      ) : null}
    </>
  );
}

interface ContentCardProps {
  item: ContentItem;
  slides: Slide[];
  isSelected: boolean;
  isEditing: boolean;
  onOpen: (itemId: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
  onContextMenu: (event: React.MouseEvent, data: Id) => void;
  onRename: (itemId: Id, title: string) => void;
}

function ContentCard({ item, slides, isSelected, isEditing, onOpen, onOpenMenu, onContextMenu, onRename }: ContentCardProps) {
  const { slideElementsBySlideId } = useProjectContent();
  const firstSlide = slides[0] ?? null;
  const firstSlideElements = firstSlide ? slideElementsBySlideId.get(firstSlide.id) ?? [] : [];
  const scene = firstSlide ? buildThumbnailScene(firstSlide, firstSlideElements) : null;

  function handleOpen() {
    onOpen(item.id);
  }

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMenu(event.currentTarget, item.id);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
    onContextMenu(event, item.id);
  }

  function handleRename(title: string) {
    onRename(item.id, title);
  }

  return (
    <div className="group cursor-pointer" onContextMenu={handleContextMenu}>
      <Thumbnail.Tile
        onClick={handleOpen}
        selected={isSelected}
        className={isSelected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : ''}
        body={(
          <>
            {scene ? (
              <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
              </SceneFrame>
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-tertiary text-sm uppercase tracking-wider text-tertiary">
                Empty
              </div>
            )}

            <div className="absolute right-1 top-1 hidden group-hover:block">
              <Button.Icon label="Content item options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
                <Ellipsis />
              </Button.Icon>
            </div>
          </>
        )}
        caption={(
          <div className="flex items-center gap-2">
            <ContentItemIcon entity={item} className="shrink-0 text-tertiary" size={14} strokeWidth={1.75} />
            <EditableText
              value={item.title}
              onCommit={handleRename}
              editing={isEditing}
              className="min-w-0 truncate text-sm text-secondary"
            />
          </div>
        )}
      />
    </div>
  );
}
