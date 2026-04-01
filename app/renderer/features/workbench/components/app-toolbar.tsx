import { useMemo, useState } from 'react';
import { Icon } from '../../../components/icon';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon, type SegmentedControlValue } from '../../../components/segmented-control';
import { SettingsDialog } from '../../../components/settings-dialog';
import { useWorkbench } from '../../../contexts/workbench-context';
import { OutputToggle } from '../../outputs/components/output-toggle';
import type { WorkbenchMode } from '../../../types/ui';
import { SegmentedControl as Control } from '../../../components/segmented-controls';
import { IconButton } from '@renderer/components/icon-button';

interface PanelToggleButton {
  id: 'left' | 'right' | 'bottom';
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface AppToolbarProps {
  audienceOutputActive: boolean;
  onToggleAudienceOutput: () => void;
  panelToggles: PanelToggleButton[];
}

export function AppToolbar({ audienceOutputActive, onToggleAudienceOutput, panelToggles }: AppToolbarProps) {
  const { workbenchMode, setWorkbenchMode } = useWorkbench();
  const [showSettings, setShowSettings] = useState(false);
  const activePanelIds = useMemo(
    () => panelToggles.filter((toggle) => toggle.active).map((toggle) => toggle.id),
    [panelToggles],
  );

  function handleWorkbenchModeChange(nextValue: string) {
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
      className="border-b border-border-primary bg-background-primary px-3 py-1.5"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <Control.Root value={workbenchMode} onValueChange={handleWorkbenchModeChange} aria-label="Application views">
            <Control.Label value="show">Show</Control.Label>
            <Control.Label value="slide-editor">Edit</Control.Label>
            <Control.Label value="overlay-editor">Overlay</Control.Label>
            <Control.Label value="template-editor">Templates</Control.Label>
          </Control.Root>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <OutputToggle label="Audience" active={audienceOutputActive} onClick={onToggleAudienceOutput} />

          <SegmentedControl
            label="Panel visibility"
            selectionMode="multiple"
            value={activePanelIds}
            onValueChange={handlePanelToggleChange}
          >
            {panelToggles.map(renderPanelToggleItem)}
          </SegmentedControl>

          <IconButton type="button" onClick={handleOpenSettings} title="Settings" aria-label="Settings">
            <Icon.settings_01 />
          </IconButton>
        </div>
      </div>
      {showSettings ? <SettingsDialog onClose={handleCloseSettings} /> : null}
    </header>
  );
}

function renderPanelToggleItem(toggle: PanelToggleButton) {
  return (
    <SegmentedControlItem key={toggle.id} value={toggle.id} title={`${toggle.active ? 'Hide' : 'Show'} ${toggle.label} panel`} variant="icon" >
      <SegmentedControlItemIcon>{panelToggleIcon(toggle.id)}</SegmentedControlItemIcon>
      <span className="sr-only">{toggle.label}</span>
    </SegmentedControlItem>
  );
}

function isWorkbenchMode(value: string): value is WorkbenchMode {
  return value === 'show' || value === 'slide-editor' || value === 'overlay-editor' || value === 'template-editor';
}

function panelToggleIcon(id: PanelToggleButton['id']) {
  if (id === 'left') return <Icon.layout_left size={14} strokeWidth={1.5} />;
  if (id === 'bottom') return <Icon.layout_bottom size={14} strokeWidth={1.5} />;
  return <Icon.layout_right size={14} strokeWidth={1.5} />;
}
