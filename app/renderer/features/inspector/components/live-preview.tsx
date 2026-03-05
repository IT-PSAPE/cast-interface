import { SceneFrame } from '../../../components/scene-frame';
import { SceneStage } from '../../workspace/rendering/scene-stage';
import { useRenderScenes } from '../../workspace/rendering/render-scene-provider';

export function LivePreview() {
  const { liveScene } = useRenderScenes();
  const hasAnyLayer = liveScene.nodes.length > 0;

  return (
    <div className="border-b border-stroke bg-live-screen relative">
      <div className="w-full p-2">
        {!hasAnyLayer ? (
          <div className="aspect-video w-full grid place-items-center">
            <span className="text-[12px] text-text-muted uppercase tracking-wider">No output</span>
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

      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-live" />
        <span className="text-[10px] font-semibold text-live uppercase tracking-wider">Live</span>
      </div>
    </div>
  );
}
