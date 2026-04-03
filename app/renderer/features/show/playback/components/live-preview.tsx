import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import { SceneFrame } from '../../../../components/display/scene-frame';
import { SceneStage } from '../../../stage/rendering/scene-stage';
import { useProgramOutput } from '../contexts/program-output-context';

export function LivePreview() {
  const { scene, background } = useProgramOutput();
  const checkerboard = background === 'transparent';
  const stageClassName = checkerboard ? 'bg-transparent' : 'bg-black';

  return (
    <div className="relative border-b border-border-primary bg-background-secondary">
      <SceneFrame
        width={NDI_OUTPUT_WIDTH}
        height={NDI_OUTPUT_HEIGHT}
        checkerboard={checkerboard}
        stageClassName={stageClassName}
      >
        <SceneStage
          scene={scene}
          surface="show"
          className="h-full w-full"
        />
      </SceneFrame>
    </div>
  );
}
