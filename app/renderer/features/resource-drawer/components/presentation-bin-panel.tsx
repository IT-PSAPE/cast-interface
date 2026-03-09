import { useMemo, useState } from 'react';
import type { Id, Presentation, Slide } from '@core/types';
import { ContextMenu, type ContextMenuItem } from '../../../components/context-menu';
import { Icon } from '../../../components/icon';
import { EditableText } from '../../../components/editable-text';
import { IconButton } from '../../../components/icon-button';
import { SceneFrame } from '../../../components/scene-frame';
import { ThumbnailTile } from '../../../components/thumbnail-tile';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { buildPresentationMenuItems } from '../../library-browser/utils/build-presentation-menu-items';
import { useLibraryPanelManagement } from '../../library-browser/hooks/use-library-panel-management';
import { buildThumbnailScene } from '../../stage/rendering/build-render-scene';
import { SceneStage } from '../../stage/rendering/scene-stage';
import { slideTextPreview } from '../../../utils/slides';

interface PresentationBinPanelProps {
  filterText: string;
}

interface MenuState {
  x: number;
  y: number;
  presentationId: Id;
}

interface PresentationCardProps {
  index: number;
  presentation: Presentation;
  slides: Slide[];
  isSelected: boolean;
  isEditing: boolean;
  onOpen: (presentationId: Id) => void;
  onOpenMenu: (presentationId: Id, button: HTMLButtonElement) => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>, presentationId: Id) => void;
  onRename: (presentationId: Id, title: string) => void;
}

function PresentationCard({
  index,
  presentation,
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
  const previewText = firstSlide ? slideTextPreview(firstSlideElements) : 'No slides yet';

  function handleOpen() {
    onOpen(presentation.id);
  }

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMenu(presentation.id, event.currentTarget);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
    onContextMenu(event, presentation.id);
  }

  function handleRename(title: string) {
    onRename(presentation.id, title);
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
              <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0">
                <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
              </SceneFrame>
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-background-tertiary text-[11px] uppercase tracking-wider text-text-tertiary">
                Empty
              </div>
            )}

            <div className="absolute right-1 top-1 hidden group-hover:block">
              <IconButton
                label="Presentation options"
                onClick={handleMenuClick}
                className="h-5 w-5 border-border-primary bg-background-tertiary/80 text-[11px] leading-none"
              >
                <Icon.dots_horizontal size={14} strokeWidth={2} />
              </IconButton>
            </div>
          </>
        )}
        caption={(
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-text-secondary">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <EditableText
                value={presentation.title}
                onCommit={handleRename}
                editing={isEditing}
                className="truncate text-[12px] text-text-secondary"
              />
              <div className="truncate text-[11px] text-text-tertiary">
                {slides.length > 0 ? `${slides.length} slide${slides.length === 1 ? '' : 's'} · ${previewText}` : 'No slides yet'}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

export function PresentationBinPanel({ filterText }: PresentationBinPanelProps) {
  const {
    currentDrawerPresentationId,
    currentPlaylistId,
    currentLibraryBundle,
    browsePresentation,
    isDetachedPresentationBrowser,
  } = useNavigation();
  const { presentations, slidesByPresentationId } = useProjectContent();
  const {
    renamePresentation,
    deletePresentation,
    movePresentation,
    movePresentationToSegment,
  } = useLibraryPanelManagement();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [editingPresentationId, setEditingPresentationId] = useState<Id | null>(null);

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredPresentations = useMemo(() => {
    return presentations.filter((presentation) => {
      if (!normalizedFilter) return true;
      if (presentation.title.toLowerCase().includes(normalizedFilter)) return true;
      if (presentation.kind.toLowerCase().includes(normalizedFilter)) return true;
      const slides = slidesByPresentationId.get(presentation.id) ?? [];
      return slides.some((slide) => {
        const slideLabel = `slide ${slide.order + 1}`.toLowerCase();
        return slideLabel.includes(normalizedFilter);
      });
    });
  }, [normalizedFilter, presentations, slidesByPresentationId]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menuState) return [];
    return buildPresentationMenuItems({
      presentationId: menuState.presentationId,
      scope: 'library',
      currentPlaylistId,
      selectedTree: currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      presentationIds: presentations.map((presentation) => presentation.id),
      selectPresentation: browsePresentation,
      movePresentation,
      movePresentationToSegment,
      beginRenamePresentation: setEditingPresentationId,
      deletePresentation,
    });
  }, [browsePresentation, currentLibraryBundle, currentPlaylistId, deletePresentation, menuState, movePresentation, movePresentationToSegment, presentations]);

  function openMenuAt(presentationId: Id, x: number, y: number) {
    setMenuState({ presentationId, x, y });
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>, presentationId: Id) {
    event.preventDefault();
    openMenuAt(presentationId, event.clientX, event.clientY);
  }

  function handleMenuButtonClick(presentationId: Id, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    openMenuAt(presentationId, rect.left, rect.bottom + 4);
  }

  function handleRename(presentationId: Id, title: string) {
    void renamePresentation(presentationId, title);
    setEditingPresentationId(null);
  }

  function handleCloseMenu() {
    setMenuState(null);
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {filteredPresentations.map((presentation, index) => (
          <PresentationCard
            key={presentation.id}
            index={index}
            presentation={presentation}
            slides={slidesByPresentationId.get(presentation.id) ?? []}
            isSelected={isDetachedPresentationBrowser && currentDrawerPresentationId === presentation.id}
            isEditing={editingPresentationId === presentation.id}
            onOpen={browsePresentation}
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
