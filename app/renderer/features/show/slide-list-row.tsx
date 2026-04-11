import type { Id } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { EditableTextArea } from '../../components/form/editable-text-area';
import { SceneFrame } from '../../components/display/scene-frame';
import { ThumbnailLiveBadge } from '../../components/display/thumbnail-live-badge';
import { Thumbnail } from '../../components/display/thumbnail';
import type { OutlineSlideRow } from './use-slide-list-view';
import { SceneStage } from '../stage/scene-stage';
import type { RenderScene } from '../stage/scene-types';

interface SlideOutlineRowProps {
  row: OutlineSlideRow;
  scene: RenderScene;
  isFocused: boolean;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  onTextCommit: (slideId: Id, nextText: string) => void;
}

export function SlideOutlineRow({ row, scene, isFocused, onSelect, onOpen, onTextCommit }: SlideOutlineRowProps) {
  const rowStateClass = isFocused
    ? 'border-brand-400/80 bg-brand-400/8'
    : 'border-primary bg-primary/40';

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
        <span className="w-full truncate text-md font-medium text-secondary">
          {row.primaryText}
        </span>
      );
    }

    return (
      <EditableTextArea
        value={row.text}
        onCommit={handleTextCommit}
        trimOnCommit={false}
        placeholder="Lyric text"
        className="w-full text-md font-medium leading-6 text-secondary"
      />
    );
  }

  return (
    <Thumbnail.Row
      onClick={handleSelect}
      onDoubleClick={row.textEditable ? undefined : handleOpen}
      className={rowStateClass}
      preview={(
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0">
          {row.elements.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
              Empty
            </div>
          )}
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      )}
      body={(
        <>
          <div className={cn('flex gap-2', row.textEditable ? 'items-start' : 'items-center')}>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{row.index + 1}.</span>
            {renderRowText()}
          </div>

          {!row.textEditable && row.secondaryText ? (
            <p className="m-0 truncate text-sm text-tertiary" title={row.secondaryText}>
              {row.secondaryText}
            </p>
          ) : null}
        </>
      )}
      bodyClassName={row.textEditable ? 'content-start' : 'content-center'}
      overlay={row.state === 'live' ? <ThumbnailLiveBadge className="absolute right-2 top-2" /> : null}
    />
  );
}
