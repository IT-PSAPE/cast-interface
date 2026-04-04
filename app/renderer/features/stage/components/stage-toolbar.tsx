import type { ReactNode } from 'react';
import { isLyricContentItem } from '@core/content-items';
import { Globe, Image, PencilLine, Square, Type } from 'lucide-react';
import { Button } from '../../../components/controls/button';
import { useCast } from '../../../contexts/cast-context';
import { useElements } from '../../../contexts/element/element-context';
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
    <Button
      label={label}
      onClick={onClick}
      disabled={disabled}
      size="icon-lg"
      variant="ghost"
      className="text-text-primary hover:bg-white/10"
    >
      {children}
    </Button>
  );
}

interface StageToolbarProps {
  onOpenMediaPicker?: () => void;
}

export function StageToolbar({ onOpenMediaPicker }: StageToolbarProps) {
  const { createText, createShape } = useElements();
  const { setStatusText } = useCast();
  const { currentContentItem } = useNavigation();
  const { currentTemplate } = useTemplateEditor();
  const { state: { workbenchMode } } = useWorkbench();
  const hideAddText = workbenchMode === 'slide-editor'
    ? isLyricContentItem(currentContentItem)
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
          <Type size={18} strokeWidth={1.5} />
        </ToolbarButton>
      ) : null}
      <ToolbarButton label="Add Shape" onClick={handleAddShape}>
        <Square size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Media" onClick={handleAddMedia}>
        <Image size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Draw Path" onClick={handleUnavailable} disabled>
        <PencilLine size={18} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label="Add Web Source" onClick={handleUnavailable} disabled>
        <Globe size={18} strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  );
}
