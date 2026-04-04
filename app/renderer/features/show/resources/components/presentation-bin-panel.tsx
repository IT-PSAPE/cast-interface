import { useMemo, useState } from 'react';
import type { ContentItem, Id, Slide } from '@core/types';
import { ContextMenu, type ContextMenuItem } from '../../../../components/overlays/context-menu';
import { Ellipsis } from 'lucide-react';
import { EditableText } from '../../../../components/form/editable-text';
import { Button } from '../../../../components/controls/button';
import { ContentItemIcon } from '../../../../components/display/presentation-entity-icon';
import { SceneFrame } from '../../../../components/display/scene-frame';
import { ThumbnailTile } from '../../../../components/display/thumbnail-tile';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useProjectContent } from '../../../../contexts/use-project-content';
import { buildContentItemMenuItems } from '../../library/utils/build-presentation-menu-items';
import { useLibraryPanelManagement } from '../../library/hooks/use-library-panel-management';
import { buildThumbnailScene } from '../../../stage/rendering/build-render-scene';
import { SceneStage } from '../../../stage/rendering/scene-stage';

interface ContentBinPanelProps {
  filterText: string;
}

interface MenuState {
  x: number;
  y: number;
  itemId: Id;
}

interface PresentationCardProps {
  item: ContentItem;
  slides: Slide[];
  isSelected: boolean;
  isEditing: boolean;
  onOpen: (itemId: Id) => void;
  onOpenMenu: (itemId: Id, button: HTMLButtonElement) => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>, itemId: Id) => void;
  onRename: (itemId: Id, title: string) => void;
}

function ContentCard({
  item,
  slides,
  isSelected,
  isEditing,
  onOpen,
  onOpenMenu,
  onContextMenu,
  onRename,
}: PresentationCardProps) {
  const { slideElementsBySlideId } = useProjectContent();
  const firstSlide = slides[0] ?? null;
  const firstSlideElements = firstSlide ? slideElementsBySlideId.get(firstSlide.id) ?? [] : [];
  const scene = firstSlide ? buildThumbnailScene(firstSlide, firstSlideElements) : null;

  function handleOpen() {
    onOpen(item.id);
  }

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMenu(item.id, event.currentTarget);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
    onContextMenu(event, item.id);
  }

  function handleRename(title: string) {
    onRename(item.id, title);
  }

  return (
    <div className="group cursor-pointer" onContextMenu={handleContextMenu}>
      <ThumbnailTile
        onClick={handleOpen}
        selected={isSelected}
        className={isSelected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : ''}
        body={(
          <>
            {scene ? (
              <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0" checkerboard>
                <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
              </SceneFrame>
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-background-tertiary text-sm uppercase tracking-wider text-text-tertiary">
                Empty
              </div>
            )}

            <div className="absolute right-1 top-1 hidden group-hover:block">
              <Button
                label="Content item options"
                onClick={handleMenuClick}
                size="icon-sm"
                className="border-border-primary bg-background-tertiary/80"
              >
                <Ellipsis size={14} strokeWidth={2} />
              </Button>
            </div>
          </>
        )}
        caption={(
          <div className="flex items-center gap-2">
            <ContentItemIcon entity={item} className="shrink-0 text-text-tertiary" size={14} strokeWidth={1.75} />
            <EditableText
              value={item.title}
              onCommit={handleRename}
              editing={isEditing}
              className="min-w-0 truncate text-sm text-text-secondary"
            />
          </div>
        )}
      />
    </div>
  );
}

export function ContentBinPanel({ filterText }: ContentBinPanelProps) {
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
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [editingPresentationId, setEditingPresentationId] = useState<Id | null>(null);

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredPresentations = useMemo(() => {
    return contentItems.filter((item) => {
      if (!normalizedFilter) return true;
      if (item.title.toLowerCase().includes(normalizedFilter)) return true;
      if (item.type.toLowerCase().includes(normalizedFilter)) return true;
      const slides = slidesByContentItemId.get(item.id) ?? [];
      return slides.some((slide) => {
        const slideLabel = `slide ${slide.order + 1}`.toLowerCase();
        return slideLabel.includes(normalizedFilter);
      });
    });
  }, [contentItems, normalizedFilter, slidesByContentItemId]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menuState) return [];
    return buildContentItemMenuItems({
      itemId: menuState.itemId,
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
  }, [browseContentItem, contentItems, currentLibraryBundle, currentPlaylistId, deleteContentItem, menuState, moveContentItem, moveContentItemToSegment]);

  function openMenuAt(itemId: Id, x: number, y: number) {
    setMenuState({ itemId, x, y });
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>, itemId: Id) {
    event.preventDefault();
    openMenuAt(itemId, event.clientX, event.clientY);
  }

  function handleMenuButtonClick(itemId: Id, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    openMenuAt(itemId, rect.left, rect.bottom + 4);
  }

  function handleRename(itemId: Id, title: string) {
    void renameContentItem(itemId, title);
    setEditingPresentationId(null);
  }

  function handleCloseMenu() {
    setMenuState(null);
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {filteredPresentations.map((presentation) => (
          <ContentCard
            key={presentation.id}
            item={presentation}
            slides={slidesByContentItemId.get(presentation.id) ?? []}
            isSelected={isDetachedContentBrowser && currentDrawerContentItemId === presentation.id}
            isEditing={editingPresentationId === presentation.id}
            onOpen={browseContentItem}
            onOpenMenu={handleMenuButtonClick}
            onContextMenu={handleContextMenu}
            onRename={handleRename}
          />
        ))}
      </div>

      {menuState ? (
        <ContextMenu
          x={menuState.x}
          y={menuState.y}
          items={menuItems}
          onClose={handleCloseMenu}
        />
      ) : null}
    </>
  );
}
