import { useMemo, useState, type CSSProperties } from 'react';
import { PanelBottom, PanelLeft, PanelRight, Settings } from 'lucide-react';
import { SettingsDialog } from '../settings/settings-dialog';
import { useWorkbench } from '../../contexts/workbench-context';
import { OutputToggle } from '../show/output-toggle';
import type { WorkbenchMode } from '../../types/ui';
import { Button } from '@renderer/components/controls/button';
import { SegmentedControl } from '@renderer/components/controls/segmented-control';

const isMac = window.castApi.platform === 'darwin';

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
  const { state: { workbenchMode }, actions: { setWorkbenchMode } } = useWorkbench();
  const [showSettings, setShowSettings] = useState(false);
  const activePanelIds = useMemo(
    () => panelToggles.filter((toggle) => toggle.active).map((toggle) => toggle.id),
    [panelToggles],
  );

  function handleWorkbenchModeChange(nextValue: string | string[]) {
    if (Array.isArray(nextValue)) return;
    if (!isWorkbenchMode(nextValue) || nextValue === workbenchMode) return;
    setWorkbenchMode(nextValue);
  }

  function handlePanelToggleChange(nextValue: string | string[]) {
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
      className="border-b border-primary bg-primary px-3 py-1.5"
      style={isMac ? { WebkitAppRegion: 'drag', paddingLeft: '78px' } as CSSProperties : undefined}
    >
      <div className="flex items-center gap-3" style={isMac ? { WebkitAppRegion: 'no-drag' } as CSSProperties : undefined}>
        <div className="flex items-center">
          <SegmentedControl value={workbenchMode} onValueChange={handleWorkbenchModeChange} label="Application views">
            <SegmentedControl.Label value="show">Show</SegmentedControl.Label>
            <SegmentedControl.Label value="slide-editor">Edit</SegmentedControl.Label>
            <SegmentedControl.Label value="overlay-editor">Overlay</SegmentedControl.Label>
            <SegmentedControl.Label value="template-editor">Templates</SegmentedControl.Label>
          </SegmentedControl>
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

          <Button.Icon label="Settings" onClick={handleOpenSettings} size="md">
            <Settings className="size-4" />
          </Button.Icon>
        </div>
      </div>
      {showSettings ? <SettingsDialog onClose={handleCloseSettings} /> : null}
    </header>
  );
}

function renderPanelToggleItem(toggle: PanelToggleButton) {
  return (
    <SegmentedControl.Icon key={toggle.id} value={toggle.id} title={`${toggle.active ? 'Hide' : 'Show'} ${toggle.label} panel`}>
      {panelToggleIcon(toggle.id)}
      <span className="sr-only">{toggle.label}</span>
    </SegmentedControl.Icon>
  );
}

function isWorkbenchMode(value: string): value is WorkbenchMode {
  return value === 'show' || value === 'slide-editor' || value === 'overlay-editor' || value === 'template-editor';
}

function panelToggleIcon(id: PanelToggleButton['id']) {
  if (id === 'left') return <PanelLeft size={14} strokeWidth={1.5} />;
  if (id === 'bottom') return <PanelBottom size={14} strokeWidth={1.5} />;
  return <PanelRight size={14} strokeWidth={1.5} />;
}
