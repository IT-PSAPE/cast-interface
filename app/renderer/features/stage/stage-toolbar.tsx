import type { ReactNode } from 'react';
import { isLyricDeckItem } from '@core/deck-items';
import { Globe, Image, PencilLine, Square, Type } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { useCast } from '../../contexts/cast-context';
import { useElements } from '../../contexts/element/element-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { useWorkbench } from '../../contexts/workbench-context';

interface StageToolbarProps {
  onOpenMediaPicker?: () => void;
}

export function StageToolbar({ onOpenMediaPicker }: StageToolbarProps) {
  const { createText, createShape } = useElements();
  const { setStatusText } = useCast();
  const { currentDeckItem } = useNavigation();
  const { currentTemplate } = useTemplateEditor();
  const { state: { workbenchMode } } = useWorkbench();
  const hideAddText = workbenchMode === 'slide-editor'
    ? isLyricDeckItem(currentDeckItem)
    : workbenchMode === 'template-editor'
      ? currentTemplate?.kind === 'lyrics'
      : false;

  function handleAddMedia() {
    if (onOpenMediaPicker) {
      onOpenMediaPicker();
    }
  }

  function handleUnavailable() {
    setStatusText('This element type is not yet available.');
  }

  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-primary bg-tertiary/90 px-1 py-0.5 shadow-2xl backdrop-blur-sm">
      {!hideAddText ? (
        <Button.Icon label="Add Text" onClick={createText}>
          <Type size={18} strokeWidth={1.5} />
        </Button.Icon>
      ) : null}
      <Button.Icon label="Add Shape" onClick={createShape}>
        <Square size={18} strokeWidth={1.5} />
      </Button.Icon>
      <Button.Icon label="Add Media" onClick={handleAddMedia}>
        <Image size={18} strokeWidth={1.5} />
      </Button.Icon>
      <Button.Icon label="Draw Path" onClick={handleUnavailable} disabled>
        <PencilLine size={18} strokeWidth={1.5} />
      </Button.Icon>
      <Button.Icon label="Add Web Source" onClick={handleUnavailable} disabled>
        <Globe size={18} strokeWidth={1.5} />
      </Button.Icon>
    </div>
  );
}
