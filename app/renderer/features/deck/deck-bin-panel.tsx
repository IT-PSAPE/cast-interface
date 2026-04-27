import { useEffect, useRef } from 'react';
import type { DeckItem, Id, Slide } from '@core/types';
import { RenameField, type RenameFieldHandle } from '@renderer/components 2.0/rename-field';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { SceneFrame } from '../../components/display/scene-frame';
import { SelectableRow } from '../../components/display/selectable-row';
import { Thumbnail } from '../../components/display/thumbnail';
import { useProjectContent } from '../../contexts/use-project-content';
import { useResourceDrawer } from '../workbench/resource-drawer-context';
import { buildThumbnailScene } from '../canvas/build-render-scene';
import { SceneStage } from '../canvas/scene-stage';
import { BinPanelLayout } from '../workbench/bin-panel-layout';
import { useDeckBin } from './use-deck-bin';

interface DeckBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function DeckBinPanel({ filterText, gridItemSize }: DeckBinPanelProps) {
  const { drawerViewMode } = useResourceDrawer();
  const {
    filteredDeckItems,
    menu,
    menuItems,
    editingDeckItemId,
    browseDeckItem,
    isDetachedDeckBrowser,
    currentDrawerDeckItemId,
    handleRename,
    slidesByDeckItemId,
  } = useDeckBin(filterText);

  return (
    <BinPanelLayout
      gridItemSize={gridItemSize}
      mode={drawerViewMode}
      menuState={menu.menuState}
      menuItems={menuItems}
      onCloseMenu={menu.close}
    >
      {filteredDeckItems.map((presentation) => {
        const shared = {
          key: presentation.id,
          item: presentation,
          slides: slidesByDeckItemId.get(presentation.id) ?? [],
          isSelected: isDetachedDeckBrowser && currentDrawerDeckItemId === presentation.id,
          isEditing: editingDeckItemId === presentation.id,
          onOpen: browseDeckItem,
          onContextMenu: menu.openFromEvent,
          onRename: handleRename,
        };
        return drawerViewMode === 'list'
          ? <DeckItemRow {...shared} />
          : <DeckItemTile {...shared} />;
      })}
    </BinPanelLayout>
  );
}

interface DeckItemProps {
  item: DeckItem;
  slides: Slide[];
  isSelected: boolean;
  isEditing: boolean;
  onOpen: (itemId: Id) => void;
  onContextMenu: (event: React.MouseEvent, data: Id) => void;
  onRename: (itemId: Id, title: string) => void;
}

function DeckItemRow({ item, slides, isSelected, isEditing, onOpen, onContextMenu, onRename }: DeckItemProps) {
  const renameRef = useRef<RenameFieldHandle>(null);

  useEffect(() => {
    if (isEditing) renameRef.current?.startEditing();
  }, [isEditing]);

  function handleOpen() {
    onOpen(item.id);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
    onContextMenu(event, item.id);
  }

  function handleRename(title: string) {
    onRename(item.id, title);
  }

  return (
    <div className="group" onContextMenu={handleContextMenu}>
      <SelectableRow.Root selected={isSelected} onClick={handleOpen} className="h-9">
        <SelectableRow.Leading>
          <DeckItemIcon entity={item} size={14} strokeWidth={1.75} />
        </SelectableRow.Leading>
        <SelectableRow.Label>
          <RenameField ref={renameRef} value={item.title} onValueChange={handleRename} className="label-xs" />
        </SelectableRow.Label>
        <SelectableRow.Trailing>
          <span className="text-xs text-tertiary">{slides.length} {slides.length === 1 ? 'slide' : 'slides'}</span>
        </SelectableRow.Trailing>
      </SelectableRow.Root>
    </div>
  );
}

function DeckItemTile({ item, slides, isSelected, isEditing, onOpen, onContextMenu, onRename }: DeckItemProps) {
  const { slideElementsBySlideId } = useProjectContent();
  const firstSlide = slides[0] ?? null;
  const firstSlideElements = firstSlide ? slideElementsBySlideId.get(firstSlide.id) ?? [] : [];
  const scene = firstSlide ? buildThumbnailScene(firstSlide, firstSlideElements) : null;
  const renameRef = useRef<RenameFieldHandle>(null);

  useEffect(() => {
    if (isEditing) renameRef.current?.startEditing();
  }, [isEditing]);

  function handleOpen() {
    onOpen(item.id);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
    onContextMenu(event, item.id);
  }

  function handleRename(title: string) {
    onRename(item.id, title);
  }

  return (
    <div className="group cursor-pointer" onContextMenu={handleContextMenu}>
      <Thumbnail.Tile onClick={handleOpen} selected={isSelected}>
        <Thumbnail.Body>
          <ScenePreview scene={scene} />
        </Thumbnail.Body>
        <Thumbnail.Caption>
          <div className="flex items-center gap-2">
            <DeckItemIcon entity={item} className="shrink-0 text-tertiary" size={14} strokeWidth={1.75} />
            <RenameField
              ref={renameRef}
              value={item.title}
              onValueChange={handleRename} className="label-xs"
            />
          </div>
        </Thumbnail.Caption>
      </Thumbnail.Tile>
    </div>
  );
}

function ScenePreview({ scene }: { scene: ReturnType<typeof buildThumbnailScene> | null }) {
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
