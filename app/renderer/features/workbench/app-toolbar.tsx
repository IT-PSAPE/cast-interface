import { useMemo, type CSSProperties } from 'react';
import { PanelBottom, PanelLeft, PanelRight, Settings } from 'lucide-react';
import { useWorkbench } from '../../contexts/workbench-context';
import type { WorkbenchMode } from '../../types/ui';
import { ReacstButton } from '@renderer/components 2.0/button';
import { SegmentedControl } from '@renderer/components/controls/segmented-control';
import { cv } from '@renderer/utils/cv';
import { useWorkbenchPanelToggles } from './use-workbench-panel-toggles';
import { useNdi } from '@renderer/contexts/app-context';

const dragStyle = { WebkitAppRegion: 'drag' } as CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties;

const outputDotStyles = cv({
  base: 'inline-block h-2 w-2 rounded-full transition-colors',
  variants: {
    active: {
      true: ['bg-green-500'],
      false: ['bg-red-500'],
    },
  },
});

const outputBorderStyles = cv({
  base: 'flex items-center gap-1.5 rounded border bg-tertiary px-2 py-1 text-sm cursor-pointer transition-colors hover:border-text-muted',
  variants: {
    active: {
      true: ['border-green-500/40'],
      false: ['border-red-500/40'],
    },
  },
});

export interface PanelToggleButton {
  id: 'left' | 'right' | 'bottom';
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function AppToolbar() {
  const { state: { workbenchMode }, actions: { setWorkbenchMode } } = useWorkbench();
  const panelToggles = useWorkbenchPanelToggles();
  const { state: { outputState }, actions: { toggleAudienceOutput, toggleStageOutput } } = useNdi();

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
    if (workbenchMode !== 'settings') {
      setWorkbenchMode('settings');
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div style={noDragStyle}>
        <SegmentedControl value={workbenchMode} onValueChange={handleWorkbenchModeChange} label="Application views">
          <SegmentedControl.Label value="show">Show</SegmentedControl.Label>
          <SegmentedControl.Label value="deck-editor">Edit</SegmentedControl.Label>
          <SegmentedControl.Label value="overlay-editor">Overlay</SegmentedControl.Label>
          <SegmentedControl.Label value="template-editor">Templates</SegmentedControl.Label>
          <SegmentedControl.Label value="stage-editor">Stage</SegmentedControl.Label>
        </SegmentedControl>
      </div>

      <div aria-hidden="true" className="min-w-6 flex-1 self-stretch" style={dragStyle} />

      <div className="flex items-center gap-2" style={noDragStyle}>
        <ReacstButton
          variant="ghost"
          onClick={toggleAudienceOutput}
          type="button"
          className={outputBorderStyles({ active: outputState.audience })}
          aria-pressed={outputState.audience}
        >
          <span className={outputDotStyles({ active: outputState.audience })} aria-hidden="true" />
          <span className="text-primary">Audience</span>
        </ReacstButton>
        <ReacstButton
          variant="ghost"
          onClick={toggleStageOutput}
          type="button"
          className={outputBorderStyles({ active: outputState.stage })}
          aria-pressed={outputState.stage}
        >
          <span className={outputDotStyles({ active: outputState.stage })} aria-hidden="true" />
          <span className="text-primary">Stage</span>
        </ReacstButton>

        <SegmentedControl
          label="Panel visibility"
          selectionMode="multiple"
          value={activePanelIds}
          onValueChange={handlePanelToggleChange}
        >
          {panelToggles.map(renderPanelToggleItem)}
        </SegmentedControl>

        <ReacstButton.Icon label="Settings" onClick={handleOpenSettings}>
          <Settings />
        </ReacstButton.Icon>
      </div>
    </div>
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
  return value === 'show' || value === 'deck-editor' || value === 'overlay-editor' || value === 'template-editor' || value === 'stage-editor' || value === 'settings';
}

function panelToggleIcon(id: PanelToggleButton['id']) {
  if (id === 'left') return <PanelLeft size={14} strokeWidth={1.5} />;
  if (id === 'bottom') return <PanelBottom size={14} strokeWidth={1.5} />;
  return <PanelRight size={14} strokeWidth={1.5} />;
}
