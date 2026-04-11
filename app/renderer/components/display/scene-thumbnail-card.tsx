import type { ReactNode } from 'react';
import type { RenderScene } from '../../features/stage/scene-types';
import { SceneFrame } from './scene-frame';
import { SceneStage } from '../../features/stage/scene-stage';
import { ThumbnailTile } from './thumbnail-tile';

interface SceneThumbnailCardProps {
  scene: RenderScene;
  index: number;
  label: string;
  selected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  badge?: ReactNode;
  menuButton?: ReactNode;
  captionIcon?: ReactNode;
  secondaryText?: string;
  emptyLabel?: string;
  checkerboard?: boolean;
}

export function SceneThumbnailCard({ scene, index, label, selected, onClick, onDoubleClick, badge, menuButton, captionIcon, secondaryText, emptyLabel, checkerboard = true }: SceneThumbnailCardProps) {
  return (
    <ThumbnailTile
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      selected={selected}
      className={selected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : undefined}
      overlay={badge}
      body={(
        <>
          <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard={checkerboard}>
            {emptyLabel ? (
              <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
                {emptyLabel}
              </div>
            ) : null}
            <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
          {menuButton ? (
            <div className="absolute right-1 top-1 hidden group-hover:block">
              {menuButton}
            </div>
          ) : null}
        </>
      )}
      caption={(
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          {captionIcon}
          <span className="truncate text-sm text-tertiary">{secondaryText ?? label}</span>
        </div>
      )}
    />
  );
}
