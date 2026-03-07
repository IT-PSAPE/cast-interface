import { useMemo } from 'react';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon, SegmentedControlItemLabel, type SegmentedControlValue } from '../../../components/segmented-control';
import { useWorkbench } from '../../../contexts/workbench-context';
import type { WorkbenchMode } from '../../../types/ui';

interface PanelToggleButton {
  id: 'left' | 'right' | 'bottom';
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface AppToolbarProps {
  panelToggles: PanelToggleButton[];
}

export function AppToolbar({ panelToggles }: AppToolbarProps) {
  const { workbenchMode, setWorkbenchMode } = useWorkbench();
  const activePanelIds = useMemo(
    () => panelToggles.filter((toggle) => toggle.active).map((toggle) => toggle.id),
    [panelToggles],
  );

  function handleWorkbenchModeChange(nextValue: SegmentedControlValue) {
    if (!isWorkbenchMode(nextValue) || nextValue === workbenchMode) return;
    setWorkbenchMode(nextValue);
  }

  function handlePanelToggleChange(nextValue: SegmentedControlValue) {
    if (!Array.isArray(nextValue)) return;
    for (const toggle of panelToggles) {
      const shouldBeActive = nextValue.includes(toggle.id);
      if (shouldBeActive !== toggle.active) toggle.onToggle();
    }
  }

  return (
    <header className="border-b border-stroke bg-gradient-to-b from-surface-3 to-surface-2 px-3 py-1.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <SegmentedControl
            label="Application views"
            selectionMode="single"
            value={workbenchMode}
            onValueChange={handleWorkbenchModeChange}
          >
            <SegmentedControlItem value="show" title="Show mode" variant="label">
              <SegmentedControlItemLabel>Show</SegmentedControlItemLabel>
            </SegmentedControlItem>
            <SegmentedControlItem value="slide-editor" title="Slide editor" variant="label">
              <SegmentedControlItemLabel>Slides</SegmentedControlItemLabel>
            </SegmentedControlItem>
            <SegmentedControlItem value="overlay-editor" title="Overlay editor" variant="label">
              <SegmentedControlItemLabel>Overlay</SegmentedControlItemLabel>
            </SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="ml-auto flex items-center">
          <SegmentedControl
            label="Panel visibility"
            selectionMode="multiple"
            value={activePanelIds}
            onValueChange={handlePanelToggleChange}
          >
            {panelToggles.map(renderPanelToggleItem)}
          </SegmentedControl>
        </div>
      </div>
    </header>
  );
}

function renderPanelToggleItem(toggle: PanelToggleButton) {
  return (
    <SegmentedControlItem
      key={toggle.id}
      value={toggle.id}
      title={`${toggle.active ? 'Hide' : 'Show'} ${toggle.label} panel`}
      variant="icon"
    >
      <SegmentedControlItemIcon>{panelToggleIcon(toggle.id)}</SegmentedControlItemIcon>
      <span className="sr-only">{toggle.label}</span>
    </SegmentedControlItem>
  );
}

function isWorkbenchMode(value: SegmentedControlValue): value is WorkbenchMode {
  return value === 'show' || value === 'slide-editor' || value === 'overlay-editor';
}

function panelToggleIcon(id: PanelToggleButton['id']) {
  if (id === 'left') return <LeftPanelIcon />;
  if (id === 'bottom') return <BottomPanelIcon />;
  return <RightPanelIcon />;
}

function LeftPanelIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1" strokeWidth="1.2" />
      <line x1="6" y1="3.4" x2="6" y2="12.6" strokeWidth="1.2" />
    </svg>
  );
}

function BottomPanelIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1" strokeWidth="1.2" />
      <line x1="2.9" y1="9.5" x2="13.1" y2="9.5" strokeWidth="1.2" />
    </svg>
  );
}

function RightPanelIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1" strokeWidth="1.2" />
      <line x1="10" y1="3.4" x2="10" y2="12.6" strokeWidth="1.2" />
    </svg>
  );
}
