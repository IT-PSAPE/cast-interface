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
  onTextCommit: (slideId: Id, nextText: string) => void;
}

export function SlideOutlineRow({ row, scene, isFocused, onSelect, onOpen, onTextCommit }: SlideOutlineRowProps) {

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

  function handleTextCommit(nextText: string) {
    onTextCommit(row.slide.id, nextText);
  }

  function renderRowText() {
    if (!row.textEditable) {
      return (
        <span className="w-full truncate text-md font-medium text-text-secondary">
          {row.primaryText}
        </span>
      );
    }

    return (
      <EditableText
        value={row.text}
        onCommit={handleTextCommit}
        multiline
        trimOnCommit={false}
        placeholder="Lyric text"
        className="w-full text-md font-medium leading-6 text-text-secondary"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSelect}
      onDoubleClick={row.textEditable ? undefined : handleOpen}
      className={`grid w-full grid-cols-[220px_1fr] overflow-hidden rounded border px-0 py-0 text-left transition-colors ${rowStateClass}`}
    >
      <SceneFrame width={scene.width} height={scene.height} className="border-r border-border-primary bg-background-tertiary" stageClassName="absolute inset-0">
        {row.elements.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-sm uppercase tracking-wider text-text-tertiary">
            Empty
          </div>
        )}
        <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
      </SceneFrame>

      <div className={`grid min-h-[92px] gap-1.5 p-2.5 ${row.textEditable ? 'content-start' : 'content-center'}`}>
        <div className={`flex gap-2 ${row.textEditable ? 'items-start' : 'items-center'}`}>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-text-secondary">{row.index + 1}.</span>
          {renderRowText()}
          {row.state === 'live' && <Badge state="live" label="Live" />}
        </div>

        {!row.textEditable && row.secondaryText && (
          <p className="m-0 truncate text-sm text-text-tertiary" title={row.secondaryText}>
            {row.secondaryText}
          </p>
        )}
      </div>
    </Button>
  );
}
