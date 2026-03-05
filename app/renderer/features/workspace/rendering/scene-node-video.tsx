import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Image as KonvaImage, Rect, Text } from 'react-konva';
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

    const draw = () => {
      imageRef.current?.getLayer()?.batchDraw();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [video]);

  return video ? (
    <KonvaImage ref={imageRef} image={video} x={0} y={0} width={element.width} height={element.height} />
  ) : (
    <>
      <Rect x={0} y={0} width={element.width} height={element.height} fill="#2b3039" />
      <Text text="VIDEO" x={8} y={8} fill="#d4dae6" fontSize={14} fontStyle="bold" />
    </>
  );
}
