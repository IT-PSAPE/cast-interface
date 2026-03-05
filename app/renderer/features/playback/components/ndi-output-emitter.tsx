import { useRef } from 'react';
import type { SlideFrame } from '@core/types';
import { useNdi } from '../../../contexts/ndi-context';
import { useRenderScenes } from '../../workspace/rendering/render-scene-provider';
import { SceneStage } from '../../workspace/rendering/scene-stage';

const OUTPUT_FPS = 30;

export function NdiOutputEmitter() {
  const { outputScene } = useRenderScenes();
  const { outputState } = useNdi();
  const frameBusyRef = useRef(false);
  const hasEnabledOutput = outputState.audience || outputState.stage;
  const fixedViewport = { width: outputScene.width, height: outputScene.height };

  function releaseFrameBusy() {
    frameBusyRef.current = false;
  }

  function sendFrameToMain(frame: SlideFrame) {
    const sendPromise = window.castApi.sendNdiFrame(frame);
    void sendPromise.then(releaseFrameBusy, releaseFrameBusy);
  }

  function handleFrame(frame: SlideFrame) {
    if (!hasEnabledOutput) return;
    if (frameBusyRef.current) return;

    frameBusyRef.current = true;
    sendFrameToMain(frame);
  }

  return (
    <div className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
      <SceneStage
        scene={outputScene}
        className="h-full w-full"
        fixedViewport={fixedViewport}
        emitFramesFps={hasEnabledOutput ? OUTPUT_FPS : null}
        onFrame={handleFrame}
      />
    </div>
  );
}
