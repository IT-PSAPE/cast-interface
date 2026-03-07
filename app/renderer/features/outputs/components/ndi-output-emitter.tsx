import { useCallback, useMemo, useRef } from 'react';
import type { SlideFrame } from '@core/types';
import { useNdi } from '../../../contexts/ndi-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { SceneStage } from '../../stage/rendering/scene-stage';

const OUTPUT_FPS = 30;

export function NdiOutputEmitter() {
  const { outputScene } = useRenderScenes();
  const { outputState } = useNdi();
  const frameBusyRef = useRef(false);
  const hasEnabledOutput = outputState.audience;
  const hasEnabledOutputRef = useRef(hasEnabledOutput);
  hasEnabledOutputRef.current = hasEnabledOutput;
  const fixedViewport = useMemo(() => ({ width: outputScene.width, height: outputScene.height }), [outputScene.width, outputScene.height]);

  const handleFrame = useCallback((frame: SlideFrame) => {
    if (!hasEnabledOutputRef.current) return;
    if (frameBusyRef.current) return;
    frameBusyRef.current = true;
    const sendPromise = window.castApi.sendNdiFrame(frame);
    void sendPromise.then(
      () => { frameBusyRef.current = false; },
      () => { frameBusyRef.current = false; },
    );
  }, []);

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
