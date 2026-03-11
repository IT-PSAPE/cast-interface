import type { ReactNode } from 'react';
import { Icon } from '../../../components/icon';
import { SegmentedControl as Control } from '../../../components/segmented-controls';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';

interface ViewOption {
  mode: 'focus' | 'grid' | 'list';
  label: string;
  icon: ReactNode;
}

export function SlideBrowserModeControl() {
  const { slideBrowserMode, setSlideBrowserMode } = useSlideBrowser();

  const viewOptions: ViewOption[] = [
    { mode: 'focus', label: 'Focus view', icon: <Icon.maximize_01 size={14} strokeWidth={1.5} /> },
    { mode: 'grid', label: 'Grid view', icon: <Icon.grid_01 size={14} strokeWidth={1.5} /> },
    { mode: 'list', label: 'List view', icon: <Icon.list size={14} strokeWidth={1.5} /> },
  ];

  function handleValueChange(nextValue: string) {
    if (!isSlideBrowserMode(nextValue)) {
      return;
    }

    setSlideBrowserMode(nextValue);
  }

  function renderViewItem(option: ViewOption) {
    return (
      <Control.Icon key={option.mode} value={option.mode} title={option.label} aria-label={option.label}>
        {option.icon}
      </Control.Icon>
    );
  }

  return (
    <Control.Root value={slideBrowserMode} onValueChange={handleValueChange} aria-label="Slide browser mode">
      {viewOptions.map(renderViewItem)}
    </Control.Root>
  );
}

function isSlideBrowserMode(value: string): value is ViewOption['mode'] {
  return value === 'focus' || value === 'grid' || value === 'list';
}
