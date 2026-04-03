import type { ReactNode } from 'react';
import { SegmentedControl as Control } from '../../../../components/controls/segmented-controls';
import { useSlideBrowser } from '../contexts/slide-browser-context';

interface PlaylistViewOption {
  mode: 'current' | 'tabs' | 'continuous';
  label: string;
  icon: ReactNode;
}

function PlaylistCurrentIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1" strokeWidth="1.2" />
    </svg>
  );
}

function PlaylistTabsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <path d="M3 5.5V4a1 1 0 0 1 1-1h2.2l1 1h4.8a1 1 0 0 1 1 1v1" strokeWidth="1.2" />
      <rect x="3" y="5.5" width="10" height="6.5" rx="0.9" strokeWidth="1.2" />
    </svg>
  );
}

function PlaylistContinuousIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="3" y="3" width="10" height="2.2" rx="0.7" strokeWidth="1.1" />
      <rect x="3" y="6.9" width="10" height="2.2" rx="0.7" strokeWidth="1.1" />
      <rect x="3" y="10.8" width="10" height="2.2" rx="0.7" strokeWidth="1.1" />
    </svg>
  );
}

export function PlaylistBrowserModeControl() {
  const { playlistBrowserMode, setPlaylistBrowserMode } = useSlideBrowser();

  const playlistViewOptions: PlaylistViewOption[] = [
    { mode: 'current', label: 'Current', icon: <PlaylistCurrentIcon /> },
    { mode: 'tabs', label: 'Tabs', icon: <PlaylistTabsIcon /> },
    { mode: 'continuous', label: 'Continuous', icon: <PlaylistContinuousIcon /> },
  ];

  function handleValueChange(nextValue: string) {
    if (!isPlaylistBrowserMode(nextValue)) {
      return;
    }

    setPlaylistBrowserMode(nextValue);
  }

  function renderPlaylistViewItem(option: PlaylistViewOption) {
    return (
      <Control.Icon key={option.mode} value={option.mode} title={option.label} aria-label={option.label}>
        {option.icon}
      </Control.Icon>
    );
  }

  return (
    <Control.Root value={playlistBrowserMode} onValueChange={handleValueChange} aria-label="Playlist browser mode">
      {playlistViewOptions.map(renderPlaylistViewItem)}
    </Control.Root>
  );
}

function isPlaylistBrowserMode(value: string): value is PlaylistViewOption['mode'] {
  return value === 'current' || value === 'tabs' || value === 'continuous';
}
