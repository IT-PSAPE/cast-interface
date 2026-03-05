import { useCallback, type ReactNode } from 'react';
import { ActionButton } from '../../../components/action-button';
import { TabBar, Tab } from '../../../components/tab-bar';
import { useSlides } from '../../../contexts/slide-context';
import { useUI } from '../../../contexts/ui-context';
import type { CanvasViewMode } from '../../../types/ui';

interface ViewOption {
  mode: CanvasViewMode;
  label: string;
  icon: ReactNode;
  onClick: () => void;
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

export function WorkspaceToolbar() {
  const { createSlide } = useSlides();
  const { canvasViewMode, setCanvasViewMode } = useUI();

  const showSingleView = useCallback(() => {
    setCanvasViewMode('single');
  }, [setCanvasViewMode]);

  const showGridView = useCallback(() => {
    setCanvasViewMode('grid');
  }, [setCanvasViewMode]);

  const showOutlineView = useCallback(() => {
    setCanvasViewMode('outline');
  }, [setCanvasViewMode]);

  function handleAddSlide() {
    void createSlide();
  }

  const viewOptions: ViewOption[] = [
    { mode: 'single', label: 'Single view', icon: <SingleViewIcon />, onClick: showSingleView },
    { mode: 'grid', label: 'Grid view', icon: <GridViewIcon />, onClick: showGridView },
    { mode: 'outline', label: 'Outline view', icon: <OutlineViewIcon />, onClick: showOutlineView },
  ];

  function renderViewTab(option: ViewOption) {
    return (
      <Tab key={option.mode} active={option.mode === canvasViewMode} onClick={option.onClick}>
        <span className="inline-flex items-center justify-center" title={option.label}>
          {option.icon}
        </span>
        <span className="sr-only">{option.label}</span>
      </Tab>
    );
  }

  return (
    <footer className="flex items-center gap-2 border-t border-stroke bg-surface-1/80 px-2 py-1.5">
      <ActionButton onClick={handleAddSlide} className="grid h-7 w-7 place-items-center p-0 text-[16px] leading-none">
        <span aria-hidden="true">+</span>
        <span className="sr-only">Add slide</span>
      </ActionButton>

      <div className="ml-auto">
        <TabBar label="Canvas view mode">
          {viewOptions.map(renderViewTab)}
        </TabBar>
      </div>
    </footer>
  );
}
