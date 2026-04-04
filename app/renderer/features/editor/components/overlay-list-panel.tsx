import { useState } from 'react';
import type { Id } from '@core/types';
import { Ellipsis, Trash2 } from 'lucide-react';
import { overlayToLayerElements } from '@core/presentation-layers';
import { Button } from '../../../components/controls/button';
import { ContextMenu, type ContextMenuItem } from '../../../components/overlays/context-menu';
import { useOverlayEditor } from '../../../contexts/overlay-editor/overlay-editor-context';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../components/display/scene-thumbnail-card';
import { ItemListPanel } from './item-list-panel';

interface OverlayMenuState {
  x: number;
  y: number;
  overlayId: Id;
}

export function OverlayListPanel() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay, deleteCurrentOverlay } = useOverlayEditor();
  const [overlayMenuState, setOverlayMenuState] = useState<OverlayMenuState | null>(null);

  function handleAddOverlay() {
    void createOverlay();
  }

  function handleOpenOverlayMenu(button: HTMLButtonElement, overlayId: Id) {
    const rect = button.getBoundingClientRect();
    setOverlayMenuState({ x: rect.left, y: rect.bottom + 4, overlayId });
  }

  function handleCloseOverlayMenu() {
    setOverlayMenuState(null);
  }

  function handleDeleteOverlay(overlayId: Id) {
    if (!window.confirm('Delete this overlay? This cannot be undone.')) return;
    setCurrentOverlayId(overlayId);
    void deleteCurrentOverlay();
  }

  function buildOverlayMenuItems(overlayId: Id): ContextMenuItem[] {
    return [
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        danger: true,
        onSelect: () => handleDeleteOverlay(overlayId),
      },
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
      {overlays.map((overlay, index) => {
        const scene = buildRenderScene(null, overlayToLayerElements(overlay));

        function handleSelect() {
          setCurrentOverlayId(overlay.id);
        }

        function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
          event.stopPropagation();
          handleOpenOverlayMenu(event.currentTarget as HTMLButtonElement, overlay.id);
        }

        return (
          <SceneThumbnailCard
            key={overlay.id}
            scene={scene}
            index={index}
            label={overlay.name}
            secondaryText={overlay.name}
            selected={currentOverlayId === overlay.id}
            onClick={handleSelect}
            menuButton={(
              <Button label="Overlay options" onClick={handleMenuClick} size="icon-sm" className="border-border-primary bg-background-tertiary/80">
                <Ellipsis size={14} strokeWidth={2} />
              </Button>
            )}
          />
        );
      })}
      {overlayMenuState ? <ContextMenu x={overlayMenuState.x} y={overlayMenuState.y} items={buildOverlayMenuItems(overlayMenuState.overlayId)} onClose={handleCloseOverlayMenu} /> : null}
    </ItemListPanel>
  );
}
