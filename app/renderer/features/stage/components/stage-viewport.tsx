import { SceneFrame } from '../../../components/display/scene-frame';
import { SceneStage } from '../../stage/rendering/scene-stage';
import { useStageViewportController } from '../hooks/use-stage-viewport-controller';

export function StageViewport() {
  const { actions, state } = useStageViewportController();

  return (
    <div className="grid h-full min-h-0 place-items-center overflow-hidden bg-background-primary">
      <SceneFrame width={state.scene.width} height={state.scene.height} fit="contain" className="border border-border-primary shadow-2xl" stageClassName="z-10" checkerboard>
        <SceneStage
          scene={state.scene}
          surface="slide-editor"
          editable={state.editable}
          className="h-full w-full"
          onDragOver={actions.handleDragOver}
          onDrop={actions.handleDrop}
          onViewportChange={actions.handleViewportChange}
        />
      </SceneFrame>
    </div>
  );
}
