import { SceneFrame } from '../../../components/scene-frame';
import { SceneStage } from '../../stage/rendering/scene-stage';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';

export function LivePreview() {
  const { liveScene } = useRenderScenes();
  const hasAnyLayer = liveScene.nodes.length > 0;

  return (
    <div className="border-b border-border-primary bg-background-secondary relative">
        {!hasAnyLayer ? (
          <div className="aspect-video w-full grid place-items-center">
            <span className="text-[12px] text-text-tertiary uppercase tracking-wider">No output</span>
          </div>
        ) : (
          <SceneFrame width={liveScene.width} height={liveScene.height}>
            <SceneStage
              scene={liveScene}
              className="h-full w-full"
            />
          </SceneFrame>
        )}
    </div>
  );
}
