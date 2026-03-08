import type { ReactNode } from 'react';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon, type SegmentedControlValue } from '../../../components/segmented-control';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import type { SlideBrowserMode } from '../../../types/ui';

interface ViewOption {
  mode: SlideBrowserMode;
  label: string;
  icon: ReactNode;
}

function FocusViewIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1" strokeWidth="1.25" />
    </svg>
  );
}

function GridViewIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" strokeWidth="1.25" />
      <rect x="9" y="2" width="5" height="5" strokeWidth="1.25" />
      <rect x="2" y="9" width="5" height="5" strokeWidth="1.25" />
      <rect x="9" y="9" width="5" height="5" strokeWidth="1.25" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <line x1="3" y1="4" x2="13" y2="4" strokeWidth="1.25" />
      <line x1="3" y1="8" x2="13" y2="8" strokeWidth="1.25" />
      <line x1="3" y1="12" x2="13" y2="12" strokeWidth="1.25" />
    </svg>
  );
}

export function SlideBrowserModeControl() {
  const { slideBrowserMode, setSlideBrowserMode } = useSlideBrowser();

  const viewOptions: ViewOption[] = [
    { mode: 'focus', label: 'Focus view', icon: <FocusViewIcon /> },
    { mode: 'grid', label: 'Grid view', icon: <GridViewIcon /> },
    { mode: 'list', label: 'List view', icon: <ListViewIcon /> },
  ];

  function handleValueChange(nextValue: SegmentedControlValue) {
    if (!isSlideBrowserMode(nextValue)) return;
    setSlideBrowserMode(nextValue);
  }

  function renderViewItem(option: ViewOption) {
    return (
      <SegmentedControlItem key={option.mode} value={option.mode} title={option.label} variant="icon">
        <SegmentedControlItemIcon>{option.icon}</SegmentedControlItemIcon>
        <span className="sr-only">{option.label}</span>
      </SegmentedControlItem>
    );
  }

  return (
    <SegmentedControl
      label="Slide browser mode"
      selectionMode="single"
      value={slideBrowserMode}
      onValueChange={handleValueChange}
    >
      {viewOptions.map(renderViewItem)}
    </SegmentedControl>
  );
}

function isSlideBrowserMode(value: SegmentedControlValue): value is SlideBrowserMode {
  return value === 'focus' || value === 'grid' || value === 'list';
}
