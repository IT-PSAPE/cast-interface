import { useEffect } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';
import type { RenderNode } from './scene-types';
import { useKImage } from './use-k-image';
import { resolveMediaCover } from './resolve-media-cover';

interface SceneNodeImageProps {
  node: RenderNode;
  onLoad?: () => void;
}

export function SceneNodeImage({ node, onLoad }: SceneNodeImageProps) {
  const element = node.element;
  const payload = element.payload as { src: string };
  const image = useKImage(payload.src ?? null);

  useEffect(() => {
    if (!image || !onLoad) return;

    const frameId = requestAnimationFrame(() => {
      onLoad();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [image, onLoad]);

  const crop = image
    ? resolveMediaCover(image.naturalWidth, image.naturalHeight, element.width, element.height)
    : null;

  return image ? (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={element.width}
      height={element.height}
      crop={crop ?? undefined}
    />
  ) : (
    <Rect x={0} y={0} width={element.width} height={element.height} fill="#2b303900" />
  );
}
