import type { Id } from '@core/types';
import { Badge } from '../../../components/badge';
import { Button } from '../../../components/button';
import { EditableText } from '../../../components/editable-text';
import { SceneFrame } from '../../../components/scene-frame';
import type { OutlineSlideRow } from '../hooks/use-slide-list-view';
import { SceneStage } from '../../stage/rendering/scene-stage';
import type { RenderScene } from '../../stage/rendering/scene-types';

interface SlideOutlineRowProps {
  row: OutlineSlideRow;
  scene: RenderScene;
  isFocused: boolean;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  onPrimaryTextCommit: (slideId: Id, nextPrimary: string) => void;
}

export function SlideOutlineRow({ row, scene, isFocused, onSelect, onOpen, onPrimaryTextCommit }: SlideOutlineRowProps) {

  const rowStateClass = row.state === 'live'
    ? 'border-green-500/70 bg-green-500/10'
    : isFocused
      ? 'border-brand-400/80 bg-brand-400/10'
      : 'border-border-primary bg-primary/40';

  function handleSelect() {
    onSelect(row.index);
  }

  function handleOpen() {
    onOpen(row.index);
  }

  function handlePrimaryTextCommit(nextPrimary: string) {
    onPrimaryTextCommit(row.slide.id, nextPrimary);
  }

  function renderPrimaryText() {
    if (!row.textEditable) {
      return (
        <span className="w-full truncate text-[13px] font-medium text-text-secondary">
          {row.primaryText}
        </span>
      );
    }

    return (
      <EditableText
        value={row.primaryText}
        onCommit={handlePrimaryTextCommit}
        placeholder="Slide text"
        className="w-full text-[13px] font-medium"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSelect}
      onDoubleClick={handleOpen}
      className={`grid w-full grid-cols-[220px_1fr] overflow-hidden rounded border px-0 py-0 text-left transition-colors ${rowStateClass}`}
    >
      <SceneFrame width={scene.width} height={scene.height} className="border-r border-border-primary bg-background-tertiary" stageClassName="absolute inset-0">
        {row.elements.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-[11px] uppercase tracking-wider text-text-tertiary">
            Empty
          </div>
        )}
        <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
      </SceneFrame>

      <div className="grid min-h-[92px] content-center gap-1.5 p-2.5">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-text-secondary">{row.index + 1}.</span>
          {renderPrimaryText()}
          {row.state === 'live' && <Badge state="live" label="Live" />}
        </div>

        {row.secondaryText && (
          <p className="m-0 truncate text-[12px] text-text-tertiary" title={row.secondaryText}>
            {row.secondaryText}
          </p>
        )}
      </div>
    </Button>
  );
}
