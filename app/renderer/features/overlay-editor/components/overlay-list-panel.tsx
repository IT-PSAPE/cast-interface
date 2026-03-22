import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PanelSection } from '../../../components/panel-section';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { ObjectListPanel } from '../../slide-editor/components/object-list-panel';
import { PanelRoute } from '../../workbench/components/panel-route';
import { OverlayCard } from './overlay-card';

export function OverlayListPanel() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay } = useOverlayEditor();

  function handleAddOverlay() {
    void createOverlay();
  }

  function renderOverlayCard(overlay: (typeof overlays)[number], index: number) {
    const isFocused = currentOverlayId === overlay.id;

    function handleSelectOverlay() {
      setCurrentOverlayId(overlay.id);
    }

    return (
      <OverlayCard
        key={overlay.id}
        overlay={overlay}
        index={index}
        selected={isFocused}
        onClick={handleSelectOverlay}
      />
    );
  }

  return (
    <aside
      data-ui-region="overlay-list-panel"
      className="h-full min-h-0 overflow-hidden border-r border-border-primary bg-primary"
    >
      <PanelRoute.Split splitId="overlay-list-panel" orientation="vertical" className="h-full">
        <PanelRoute.Panel id="overlay-list" defaultSize={440} minSize={180}>
          <PanelSection
            title={<span className="truncate text-sm font-medium text-text-primary">Overlays</span>}
            action={(
              <IconButton label="Add overlay" size="sm" onClick={handleAddOverlay}>
                <Icon.plus size={14} strokeWidth={2} />
              </IconButton>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2" role="grid" aria-label="Library overlays">
              {overlays.map(renderOverlayCard)}
            </div>
          </PanelSection>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="overlay-objects" defaultSize={220} minSize={160}>
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-t border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </aside>
  );
}
