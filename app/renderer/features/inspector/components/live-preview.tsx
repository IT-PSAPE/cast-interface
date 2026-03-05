import { useEffect, useRef } from 'react';
import type { SlideFrame } from '@core/types';
import { SceneFrame } from '../../../components/scene-frame';
import { useUI } from '../../../contexts/ui-context';
import { SceneStage } from '../../workspace/rendering/scene-stage';
import { useRenderScenes } from '../../workspace/rendering/render-scene-provider';

export function LivePreview() {
  const { liveScene } = useRenderScenes();
  const { workspaceView } = useUI();
  const hasAnyLayer = liveScene.nodes.length > 0;
  const frameBusyRef = useRef(false);
  const framePortRef = useRef<MessagePort | null>(null);

  useEffect(() => {
    if (!framePortRef.current) framePortRef.current = window.castApi.connectNdiFramePort();
    return () => {
      if (framePortRef.current) {
        const maybeClose = (framePortRef.current as { close?: () => void }).close;
        if (typeof maybeClose === 'function') maybeClose.call(framePortRef.current);
        framePortRef.current = null;
      }
    };
  }, []);

  function handleFrame(frame: SlideFrame) {
    if (workspaceView !== 'show') return;
    if (frameBusyRef.current) return;
    frameBusyRef.current = true;
    const port = framePortRef.current;
    if (port) {
      port.postMessage(frame);
      frameBusyRef.current = false;
      return;
    }
    void window.castApi.sendNdiFrame(frame).finally(() => {
      frameBusyRef.current = false;
    });
  }

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
              emitFramesFps={workspaceView === 'show' ? 30 : null}
              onFrame={handleFrame}
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
