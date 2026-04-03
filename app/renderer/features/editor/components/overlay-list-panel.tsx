import { overlayToLayerElements } from '@core/presentation-layers';
import { useOverlayEditor } from '../../../contexts/overlay-editor/overlay-editor-context';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../components/display/scene-thumbnail-card';
import { ItemListPanel } from './item-list-panel';

export function OverlayListPanel() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay } = useOverlayEditor();

  function handleAddOverlay() {
    void createOverlay();
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

        return (
          <SceneThumbnailCard
            key={overlay.id}
            scene={scene}
            index={index}
            label={overlay.name}
            secondaryText={overlay.name}
            selected={currentOverlayId === overlay.id}
            onClick={handleSelect}
          />
        );
      })}
    </ItemListPanel>
  );
}
