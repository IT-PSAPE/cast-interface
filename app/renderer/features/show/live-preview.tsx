import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import { SceneFrame } from '../../components/display/scene-frame';
import { SceneStage } from '../stage/scene-stage';
import { useProgramOutput } from './program-output-context';

export function LivePreview() {
  const { scene, background } = useProgramOutput();
  const checkerboard = background === 'transparent';
  const stageClassName = checkerboard ? 'bg-transparent' : 'bg-black';

  return (
    <div className="relative border-b border-primary bg-secondary">
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
