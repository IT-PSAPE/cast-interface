import type { ReactNode } from 'react';
import { Grid2x2, List } from 'lucide-react';
import { SegmentedControl } from '../../components/controls/segmented-controls';
import { useSlideBrowser } from './slide-browser-context';

interface ViewOption {
  mode: 'grid' | 'list';
  label: string;
  icon: ReactNode;
}

export function SlideBrowserModeControl() {
  const { slideBrowserMode, setSlideBrowserMode } = useSlideBrowser();

  const viewOptions: ViewOption[] = [
    { mode: 'grid', label: 'Grid view', icon: <Grid2x2 size={14} strokeWidth={1.5} /> },
    { mode: 'list', label: 'List view', icon: <List size={14} strokeWidth={1.5} /> },
  ];

  function handleValueChange(nextValue: string | string[]) {
    if (Array.isArray(nextValue)) return;
    if (!isSlideBrowserMode(nextValue)) return;
    setSlideBrowserMode(nextValue);
  }

  function renderViewItem(option: ViewOption) {
    return (
      <SegmentedControl.Icon key={option.mode} value={option.mode} title={option.label} aria-label={option.label}>
        {option.icon}
      </SegmentedControl.Icon>
    );
  }

  return (
    <SegmentedControl.Root value={slideBrowserMode} onValueChange={handleValueChange} aria-label="Slide browser mode">
      {viewOptions.map(renderViewItem)}
    </SegmentedControl.Root>
  );
}

function isSlideBrowserMode(value: string): value is ViewOption['mode'] {
  return value === 'grid' || value === 'list';
}
