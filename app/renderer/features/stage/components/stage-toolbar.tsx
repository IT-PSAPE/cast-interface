import type { ReactNode } from 'react';
import { IconButton } from '../../../components/icon-button';
import { useCast } from '../../../contexts/cast-context';
import { useElements } from '../../../contexts/element-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useWorkbench } from '../../../contexts/workbench-context';

function TextIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-current" aria-hidden="true">
      <path d="M4 4v3h1.5V5.5h4V15H7.5v1.5h5V15H10.5V5.5h4V7H16V4H4z" />
    </svg>
  );
}

function ShapeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-none stroke-current" aria-hidden="true">
      <rect x="3" y="3" width="14" height="14" rx="3" strokeWidth="1.5" />
      <path d="M13 10l-2 3h-2l2-3z" fill="currentColor" strokeWidth="0" opacity="0.5" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-none stroke-current" aria-hidden="true">
      <path d="M14.5 3.5l2 2-9 9-3 1 1-3 9-9z" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12.5 5.5l2 2" strokeWidth="1.5" />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-none stroke-current" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2" strokeWidth="1.5" />
      <circle cx="7.5" cy="8.5" r="1.5" strokeWidth="1.2" />
      <path d="M3 13l4-3 3 2 3-2 4 3" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-none stroke-current" aria-hidden="true">
      <circle cx="10" cy="10" r="7" strokeWidth="1.5" />
      <ellipse cx="10" cy="10" rx="3.5" ry="7" strokeWidth="1.2" />
      <path d="M3.5 8h13M3.5 12h13" strokeWidth="1.2" />
    </svg>
  );
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function ToolbarButton({ label, onClick, disabled = false, children }: ToolbarButtonProps) {
  return (
    <IconButton
      label={label}
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 text-text-primary hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </IconButton>
  );
}

interface StageToolbarProps {
  onOpenMediaPicker?: () => void;
}

export function StageToolbar({ onOpenMediaPicker }: StageToolbarProps) {
  const { currentPresentation } = useNavigation();
  const { createText, createShape } = useElements();
  const { setStatusText } = useCast();
  const { workbenchMode } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isLyricsPresentation = !isOverlayEdit && currentPresentation?.kind === 'lyrics';

  function handleAddText() {
    void createText();
  }

  function handleAddShape() {
    void createShape();
  }

  function handleAddMedia() {
    if (onOpenMediaPicker) {
      onOpenMediaPicker();
    }
  }

  function handleUnavailable() {
    setStatusText('This element type is not yet available.');
  }

  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-stroke bg-surface-2/90 px-1 py-0.5 shadow-elevated backdrop-blur-sm">
      <ToolbarButton label="Add Text" onClick={handleAddText} disabled={isLyricsPresentation}>
        <TextIcon />
      </ToolbarButton>
      <ToolbarButton label="Add Shape" onClick={handleAddShape} disabled={isLyricsPresentation}>
        <ShapeIcon />
      </ToolbarButton>
      <ToolbarButton label="Draw Path" onClick={handleUnavailable} disabled>
        <PenIcon />
      </ToolbarButton>
      <ToolbarButton label="Add Media" onClick={handleAddMedia} disabled={isLyricsPresentation}>
        <MediaIcon />
      </ToolbarButton>
      <ToolbarButton label="Add Web Source" onClick={handleUnavailable} disabled>
        <GlobeIcon />
      </ToolbarButton>
    </div>
  );
}
