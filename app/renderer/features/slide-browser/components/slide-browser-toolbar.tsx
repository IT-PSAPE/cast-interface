import { useCallback, type ReactNode } from 'react';
import { Button } from '../../../components/button';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon, type SegmentedControlValue } from '../../../components/segmented-control';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import type { SlideBrowserMode, PlaylistBrowserMode } from '../../../types/ui';

interface ViewOption {
  mode: SlideBrowserMode;
  label: string;
  icon: ReactNode;
}

interface PlaylistViewOption {
  mode: PlaylistBrowserMode;
  label: string;
  icon: ReactNode;
}

function SingleViewIcon() {
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

function OutlineViewIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <line x1="3" y1="4" x2="13" y2="4" strokeWidth="1.25" />
      <line x1="3" y1="8" x2="13" y2="8" strokeWidth="1.25" />
      <line x1="3" y1="12" x2="13" y2="12" strokeWidth="1.25" />
    </svg>
  );
}

function PlaylistSingleIcon() {
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

export function SlideBrowserToolbar() {
  const { createSlide } = useSlides();
  const { currentPresentation } = useNavigation();
  const { slideBrowserMode, playlistBrowserMode, setSlideBrowserMode, setPlaylistBrowserMode } = useSlideBrowser();
  const { workbenchMode } = useWorkbench();

  const showSingleView = useCallback(() => {
    setSlideBrowserMode('focus');
  }, [setSlideBrowserMode]);

  const showGridView = useCallback(() => {
    setSlideBrowserMode('grid');
  }, [setSlideBrowserMode]);

  const showOutlineView = useCallback(() => {
    setSlideBrowserMode('list');
  }, [setSlideBrowserMode]);

  const showPlaylistSingle = useCallback(() => {
    setPlaylistBrowserMode('current');
  }, [setPlaylistBrowserMode]);

  const showPlaylistTabs = useCallback(() => {
    setPlaylistBrowserMode('tabs');
  }, [setPlaylistBrowserMode]);

  const showPlaylistContinuous = useCallback(() => {
    setPlaylistBrowserMode('continuous');
  }, [setPlaylistBrowserMode]);

  function handleAddSlide() {
    if (!currentPresentation) return;
    void createSlide();
  }

  const viewOptions: ViewOption[] = [
    { mode: 'focus', label: 'Focus view', icon: <SingleViewIcon /> },
    { mode: 'grid', label: 'Grid view', icon: <GridViewIcon /> },
    { mode: 'list', label: 'List view', icon: <OutlineViewIcon /> },
  ];

  const playlistViewOptions: PlaylistViewOption[] = [
    { mode: 'current', label: 'Current', icon: <PlaylistSingleIcon /> },
    { mode: 'tabs', label: 'Tabs', icon: <PlaylistTabsIcon /> },
    { mode: 'continuous', label: 'Continuous', icon: <PlaylistContinuousIcon /> },
  ];

  const showPlaylistViewTabs = workbenchMode === 'show' && (slideBrowserMode === 'grid' || slideBrowserMode === 'list');

  function handleCanvasViewChange(nextValue: SegmentedControlValue) {
    if (!isSlideBrowserMode(nextValue)) return;
    if (nextValue === 'focus') {
      showSingleView();
      return;
    }
    if (nextValue === 'grid') {
      showGridView();
      return;
    }
    showOutlineView();
  }

  function handlePlaylistViewChange(nextValue: SegmentedControlValue) {
    if (!isPlaylistBrowserMode(nextValue)) return;
    if (nextValue === 'current') {
      showPlaylistSingle();
      return;
    }
    if (nextValue === 'tabs') {
      showPlaylistTabs();
      return;
    }
    showPlaylistContinuous();
  }

  function renderViewItem(option: ViewOption) {
    return (
      <SegmentedControlItem key={option.mode} value={option.mode} title={option.label} variant="icon">
        <SegmentedControlItemIcon>{option.icon}</SegmentedControlItemIcon>
        <span className="sr-only">{option.label}</span>
      </SegmentedControlItem>
    );
  }

  function renderPlaylistViewItem(option: PlaylistViewOption) {
    return (
      <SegmentedControlItem key={option.mode} value={option.mode} title={option.label} variant="icon">
        <SegmentedControlItemIcon>{option.icon}</SegmentedControlItemIcon>
        <span className="sr-only">{option.label}</span>
      </SegmentedControlItem>
    );
  }

  return (
    <footer className="flex items-center gap-2 border-t border-stroke bg-surface-1/80 px-2 py-1.5">
      <Button onClick={handleAddSlide} disabled={!currentPresentation} className="grid h-7 w-7 place-items-center p-0 text-[16px] leading-none">
        <span aria-hidden="true">+</span>
        <span className="sr-only">Add slide</span>
      </Button>

      <div className="ml-auto">
        <SegmentedControl
          label="Slide browser mode"
          selectionMode="single"
          value={slideBrowserMode}
          onValueChange={handleCanvasViewChange}
        >
          {viewOptions.map(renderViewItem)}
        </SegmentedControl>
      </div>

      {showPlaylistViewTabs ? (
        <div>
          <SegmentedControl
            label="Playlist browser mode"
            selectionMode="single"
            value={playlistBrowserMode}
            onValueChange={handlePlaylistViewChange}
          >
            {playlistViewOptions.map(renderPlaylistViewItem)}
          </SegmentedControl>
        </div>
      ) : null}
    </footer>
  );
}

function isSlideBrowserMode(value: SegmentedControlValue): value is SlideBrowserMode {
  return value === 'focus' || value === 'grid' || value === 'list';
}

function isPlaylistBrowserMode(value: SegmentedControlValue): value is PlaylistBrowserMode {
  return value === 'current' || value === 'tabs' || value === 'continuous';
}
