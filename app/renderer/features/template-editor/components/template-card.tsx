import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneStage } from '../../stage/rendering/scene-stage';
import { SceneFrame } from '../../../components/scene-frame';
import { ThumbnailTile } from '../../../components/thumbnail-tile';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import type { Template } from '@core/types';

interface TemplateCardProps {
  selected: boolean;
  template: Template;
  onClick: () => void;
  onDoubleClick?: () => void;
  onOpenMenu?: (button: HTMLButtonElement) => void;
}

function TemplateKindIcon({ kind }: { kind: Template['kind'] }) {
  if (kind === 'lyrics') {
    return <Icon.music_note_01 size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />;
  }
  if (kind === 'overlays') {
    return <Icon.layers_three_01 size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />;
  }
  return <Icon.presentation_chart_03 size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />;
}

export function TemplateCard({ selected, template, onClick, onDoubleClick, onOpenMenu }: TemplateCardProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMenu?.(event.currentTarget);
  }

  return (
    <ThumbnailTile
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      selected={selected}
      className={selected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : ''}
      body={(
        <>
          <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0" checkerboard>
            <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
          {onOpenMenu ? (
            <div className="absolute right-1 top-1 hidden group-hover:block">
              <IconButton label="Template options" onClick={handleMenuClick} size="sm" className="border-border-primary bg-background-tertiary/80">
                <Icon.dots_horizontal size={14} strokeWidth={2} />
              </IconButton>
            </div>
          ) : null}
        </>
      )}
      caption={(
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <TemplateKindIcon kind={template.kind} />
          <span className="truncate">{template.name}</span>
        </span>
      )}
    />
  );
}
