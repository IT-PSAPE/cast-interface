import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PanelSection } from '../../../components/panel-section';
import { TwoPaneVerticalSplit } from '../../../components/resizable-split';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { ObjectListPanel } from '../../slide-editor/components/object-list-panel';
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
      <TwoPaneVerticalSplit
        className="h-full"
        topPaneId="overlay-list"
        bottomPaneId="overlay-objects"
        defaultTopSize={440}
        defaultBottomSize={220}
        minTopSize={180}
        minBottomSize={160}
        topPane={(
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
        )}
        bottomPane={(
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        )}
      />
    </aside>
  );
}
