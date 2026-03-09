import type { ReactNode } from 'react';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useCast } from '../../../contexts/cast-context';
import { useElements } from '../../../contexts/element-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useWorkbench } from '../../../contexts/workbench-context';

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
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-border-primary bg-background-tertiary/90 px-1 py-0.5 shadow-2xl backdrop-blur-sm">
      <ToolbarButton label="Add Text" onClick={handleAddText} disabled={isLyricsPresentation}>
        <Icon.type_01 size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Shape" onClick={handleAddShape} disabled={isLyricsPresentation}>
        <Icon.square size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Draw Path" onClick={handleUnavailable} disabled>
        <Icon.pencil_line size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Media" onClick={handleAddMedia} disabled={isLyricsPresentation}>
        <Icon.image_03 size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Web Source" onClick={handleUnavailable} disabled>
        <Icon.globe_01 size={18} strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  );
}
