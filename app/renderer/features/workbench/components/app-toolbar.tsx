import { useMemo, useState } from 'react';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon, SegmentedControlItemLabel, type SegmentedControlValue } from '../../../components/segmented-control';
import { SettingsDialog } from '../../../components/settings-dialog';
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
  const [showSettings, setShowSettings] = useState(false);
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

  function handleOpenSettings() {
    setShowSettings(true);
  }

  function handleCloseSettings() {
    setShowSettings(false);
  }

  return (
    <header
      data-ui-region="app-toolbar"
      className="border-b border-border-primary bg-gradient-to-b from-background-quaternary to-background-tertiary px-3 py-1.5"
    >
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

        <div className="ml-auto flex items-center gap-2">
          <SegmentedControl
            label="Panel visibility"
            selectionMode="multiple"
            value={activePanelIds}
            onValueChange={handlePanelToggleChange}
          >
            {panelToggles.map(renderPanelToggleItem)}
          </SegmentedControl>
          <button
            type="button"
            onClick={handleOpenSettings}
            title="Settings"
            aria-label="Settings"
            className="grid h-7 w-7 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-primary"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
      {showSettings ? <SettingsDialog onClose={handleCloseSettings} /> : null}
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <circle cx="8" cy="8" r="2" strokeWidth="1.2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
