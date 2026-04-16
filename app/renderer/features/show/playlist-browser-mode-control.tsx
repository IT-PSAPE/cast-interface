import type { ReactNode } from 'react';
import { AppWindow, RectangleHorizontal, Rows3 } from 'lucide-react';
import { SegmentedControl } from '@renderer/components/controls/segmented-control';
import { useSlideBrowser } from './slide-browser-context';

interface PlaylistViewOption {
  mode: 'current' | 'tabs' | 'continuous';
  label: string;
  icon: ReactNode;
}

function PlaylistCurrentIcon() {
  return <RectangleHorizontal size={14} strokeWidth={1.7} aria-hidden="true" />;
}

function PlaylistTabsIcon() {
  return <AppWindow size={14} strokeWidth={1.7} aria-hidden="true" />;
}

function PlaylistContinuousIcon() {
  return <Rows3 size={14} strokeWidth={1.7} aria-hidden="true" />;
}

export function PlaylistBrowserModeControl() {
  const { playlistBrowserMode, setPlaylistBrowserMode } = useSlideBrowser();

  const playlistViewOptions: PlaylistViewOption[] = [
    { mode: 'current', label: 'Current', icon: <PlaylistCurrentIcon /> },
    { mode: 'tabs', label: 'Tabs', icon: <PlaylistTabsIcon /> },
    { mode: 'continuous', label: 'Continuous', icon: <PlaylistContinuousIcon /> },
  ];

  function handleValueChange(nextValue: string | string[]) {
    if (Array.isArray(nextValue)) return;
    if (!isPlaylistBrowserMode(nextValue)) {
      return;
    }

    setPlaylistBrowserMode(nextValue);
  }

  function renderPlaylistViewItem(option: PlaylistViewOption) {
    return (
      <SegmentedControl.Icon key={option.mode} value={option.mode} title={option.label} aria-label={option.label}>
        {option.icon}
      </SegmentedControl.Icon>
    );
  }

  return (
    <SegmentedControl value={playlistBrowserMode} onValueChange={handleValueChange} aria-label="Playlist browser mode">
      {playlistViewOptions.map(renderPlaylistViewItem)}
    </SegmentedControl>
  );
}

function isPlaylistBrowserMode(value: string): value is PlaylistViewOption['mode'] {
  return value === 'current' || value === 'tabs' || value === 'continuous';
}
