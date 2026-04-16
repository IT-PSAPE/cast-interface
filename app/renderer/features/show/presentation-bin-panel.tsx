import type { DeckItem, Id, Slide } from '@core/types';
import { Ellipsis } from 'lucide-react';
import { Paragraph } from '@renderer/components/display/text';
import { EditableField } from '../../components/form/editable-field';
import { Button } from '../../components/controls/button';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { SceneFrame } from '../../components/display/scene-frame';
import { Thumbnail } from '../../components/display/thumbnail';
import { useProjectContent } from '../../contexts/use-project-content';
import { useResourceDrawer } from '../resource-bin/resource-drawer-context';
import { buildThumbnailScene } from '../stage/build-render-scene';
import { SceneStage } from '../stage/scene-stage';
import { BinPanelLayout } from './bin-panel-layout';
import { useContentBin } from './use-content-bin';

interface ContentBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function ContentBinPanel({ filterText, gridItemSize }: ContentBinPanelProps) {
  const { drawerViewMode } = useResourceDrawer();
  const {
    filteredPresentations,
    menu,
    menuItems,
    editingPresentationId,
    browseDeckItem,
    isDetachedDeckBrowser,
    currentDrawerDeckItemId,
    handleRename,
    slidesByDeckItemId,
  } = useContentBin(filterText);

  return (
    <BinPanelLayout
      gridItemSize={gridItemSize}
      mode={drawerViewMode}
      menuState={menu.menuState}
      menuItems={menuItems}
      onCloseMenu={menu.close}
    >
      {filteredPresentations.map((presentation) => (
        <DeckItemCard
          key={presentation.id}
          item={presentation}
          slides={slidesByDeckItemId.get(presentation.id) ?? []}
          isSelected={isDetachedDeckBrowser && currentDrawerDeckItemId === presentation.id}
          isEditing={editingPresentationId === presentation.id}
          mode={drawerViewMode}
          onOpen={browseDeckItem}
          onOpenMenu={menu.openFromButton}
          onContextMenu={menu.openFromEvent}
          onRename={handleRename}
        />
      ))}
    </BinPanelLayout>
  );
}

interface ContentCardProps {
  item: DeckItem;
  slides: Slide[];
  isSelected: boolean;
  isEditing: boolean;
  mode: 'grid' | 'list';
  onOpen: (itemId: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
  onContextMenu: (event: React.MouseEvent, data: Id) => void;
  onRename: (itemId: Id, title: string) => void;
}

function DeckItemCard({ item, slides, isSelected, isEditing, mode, onOpen, onOpenMenu, onContextMenu, onRename }: ContentCardProps) {
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

  if (mode === 'list') {
    return (
      <div className="group cursor-pointer" onContextMenu={handleContextMenu}>
        <Thumbnail.Row
          onClick={handleOpen}
          selected={isSelected}
          className={isSelected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : ''}
          preview={renderScenePreview(scene)}
          body={(
            <>
              <div className="flex items-center gap-2">
                <DeckItemIcon entity={item} className="shrink-0 text-tertiary" size={14} strokeWidth={1.75} />
                <EditableField
                  value={item.title}
                  onCommit={handleRename}
                  editing={isEditing}
                  className="min-w-0 truncate text-sm text-secondary"
                />
              </div>
              <Paragraph.xs className="truncate text-tertiary">
                {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
              </Paragraph.xs>
            </>
          )}
          overlay={(
            <div className="absolute right-2 top-2 hidden group-hover:block">
              <Button.Icon label="Deck item options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
                <Ellipsis />
              </Button.Icon>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <div className="group cursor-pointer" onContextMenu={handleContextMenu}>
      <Thumbnail.Tile
        onClick={handleOpen}
        selected={isSelected}
        className={isSelected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : ''}
        body={renderCardBody(scene, handleMenuClick)}
        caption={(
          <div className="flex items-center gap-2">
            <DeckItemIcon entity={item} className="shrink-0 text-tertiary" size={14} strokeWidth={1.75} />
            <EditableField
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

function renderCardBody(scene: ReturnType<typeof buildThumbnailScene> | null, onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void) {
  return (
    <>
      {renderScenePreview(scene)}
      <div className="absolute right-1 top-1 hidden group-hover:block">
        <Button.Icon label="Deck item options" onClick={onMenuClick} className="border-primary bg-tertiary/80">
          <Ellipsis />
        </Button.Icon>
      </div>
    </>
  );
}

function renderScenePreview(scene: ReturnType<typeof buildThumbnailScene> | null) {
  if (!scene) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-tertiary text-sm uppercase tracking-wider text-tertiary">
        Empty
      </div>
    );
  }

  return (
    <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
      <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
    </SceneFrame>
  );
}
