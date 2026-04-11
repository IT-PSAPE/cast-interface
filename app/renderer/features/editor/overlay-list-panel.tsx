import type { Id, Overlay } from '@core/types';
import { Ellipsis, Trash2 } from 'lucide-react';
import { overlayToLayerElements } from '@core/presentation-layers';
import { Button } from '../../components/controls/button';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useOverlayEditor } from '../../contexts/overlay-editor/overlay-editor-context';
import { buildRenderScene } from '../stage/build-render-scene';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { ItemListPanel } from './item-list-panel';
import { useContextMenuState } from '../../hooks/use-context-menu-state';

export function OverlayListPanel() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay, deleteCurrentOverlay } = useOverlayEditor();
  const menu = useContextMenuState<Id>();

  function handleAddOverlay() {
    void createOverlay();
  }

  function handleDeleteOverlay(overlayId: Id) {
    if (!window.confirm('Delete this overlay? This cannot be undone.')) return;
    setCurrentOverlayId(overlayId);
    void deleteCurrentOverlay();
  }

  function buildMenuItems(overlayId: Id): ContextMenuItem[] {
    return [
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteOverlay(overlayId) },
    ];
  }

  return (
    <ItemListPanel
      title="Overlays"
      splitId="overlay-list-panel"
      listPanelId="overlay-list"
      objectsPanelId="overlay-objects"
      onAdd={handleAddOverlay}
      addLabel="Add overlay"
      listAriaLabel="Library overlays"
    >
      {overlays.map((overlay, index) => (
        <OverlayListCard
          key={overlay.id}
          overlay={overlay}
          index={index}
          isSelected={currentOverlayId === overlay.id}
          onSelect={setCurrentOverlayId}
          onOpenMenu={menu.openFromButton}
        />
      ))}
      {menu.menuState ? <ContextMenu x={menu.menuState.x} y={menu.menuState.y} items={buildMenuItems(menu.menuState.data)} onClose={menu.close} /> : null}
    </ItemListPanel>
  );
}

interface OverlayListCardProps {
  overlay: Overlay;
  index: number;
  isSelected: boolean;
  onSelect: (id: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function OverlayListCard({ overlay, index, isSelected, onSelect, onOpenMenu }: OverlayListCardProps) {
  const scene = buildRenderScene(null, overlayToLayerElements(overlay));

  function handleSelect() {
    onSelect(overlay.id);
  }

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMenu(event.currentTarget, overlay.id);
  }

  return (
    <SceneThumbnailCard
      scene={scene}
      index={index}
      label={overlay.name}
      secondaryText={overlay.name}
      selected={isSelected}
      onClick={handleSelect}
      menuButton={(
        <Button.Icon label="Overlay options" onClick={handleMenuClick} size="sm" className="border-primary bg-tertiary/80">
          <Ellipsis size={14} strokeWidth={2} />
        </Button.Icon>
      )}
    />
  );
}
