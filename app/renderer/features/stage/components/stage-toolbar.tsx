import type { ReactNode } from 'react';
import { isLyricPresentation } from '@core/presentation-entities';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useCast } from '../../../contexts/cast-context';
import { useElements } from '../../../contexts/element-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
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
      size="lg"
      variant="ghost"
      className="text-text-primary hover:bg-white/10"
    >
      {children}
    </IconButton>
  );
}

interface StageToolbarProps {
  onOpenMediaPicker?: () => void;
}

export function StageToolbar({ onOpenMediaPicker }: StageToolbarProps) {
  const { createText, createShape } = useElements();
  const { setStatusText } = useCast();
  const { currentPresentation } = useNavigation();
  const { currentTemplate } = useTemplateEditor();
  const { workbenchMode } = useWorkbench();
  const hideAddText = workbenchMode === 'slide-editor'
    ? isLyricPresentation(currentPresentation)
    : workbenchMode === 'template-editor'
      ? currentTemplate?.kind === 'lyrics'
      : false;

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
      {!hideAddText ? (
        <ToolbarButton label="Add Text" onClick={handleAddText}>
          <Icon.type_01 size={18} strokeWidth={1.5} />
        </ToolbarButton>
      ) : null}
      <ToolbarButton label="Add Shape" onClick={handleAddShape}>
        <Icon.square size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Media" onClick={handleAddMedia}>
        <Icon.image_03 size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Draw Path" onClick={handleUnavailable} disabled>
        <Icon.pencil_line size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Web Source" onClick={handleUnavailable} disabled>
        <Icon.globe_01 size={18} strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  );
}
