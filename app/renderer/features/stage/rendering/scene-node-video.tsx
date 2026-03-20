import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Image as KonvaImage, Rect } from 'react-konva';
import type { VideoElementPayload } from '@core/types';
import type { RenderNode } from './scene-types';
import { useKVideo } from './use-k-video';

interface SceneNodeVideoProps {
  node: RenderNode;
}

export function SceneNodeVideo({ node }: SceneNodeVideoProps) {
  const element = node.element;
  const payload = element.payload as VideoElementPayload;
  const video = useKVideo(payload.src, {
    autoplay: payload.autoplay,
    loop: payload.loop,
    muted: payload.muted ?? true,
  });
  const imageRef = useRef<Konva.Image | null>(null);

  useEffect(() => {
    if (!video) return;
    let rafId: number | null = null;
    let frameCallbackId: number | null = null;
    let cancelled = false;

    const draw = () => {
      imageRef.current?.getLayer()?.batchDraw();
    };

    if ('requestVideoFrameCallback' in video) {
      const handleFrame: VideoFrameRequestCallback = () => {
        if (cancelled) return;
        draw();
        frameCallbackId = video.requestVideoFrameCallback(handleFrame);
      };

      frameCallbackId = video.requestVideoFrameCallback(handleFrame);
      return () => {
        cancelled = true;
        if (frameCallbackId !== null && 'cancelVideoFrameCallback' in video) {
          video.cancelVideoFrameCallback(frameCallbackId);
        }
      };
    }

    const tick = () => {
      if (cancelled) return;
      draw();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [video]);

  return video ? (
    <KonvaImage ref={imageRef} image={video} x={0} y={0} width={element.width} height={element.height} />
  ) : (
    <>
      <Rect x={0} y={0} width={element.width} height={element.height} fill="#2b303900" />
    </>
  );
}
