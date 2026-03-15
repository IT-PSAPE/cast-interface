import { Image as KonvaImage, Rect } from 'react-konva';
import type { RenderNode } from './scene-types';
import { useKImage } from './use-k-image';

interface SceneNodeImageProps {
  node: RenderNode;
}

export function SceneNodeImage({ node }: SceneNodeImageProps) {
  const element = node.element;
  const payload = element.payload as { src: string };
  const image = useKImage(payload.src ?? null);

  return image ? (
    <KonvaImage image={image} x={0} y={0} width={element.width} height={element.height} />
  ) : (
    <Rect x={0} y={0} width={element.width} height={element.height} fill="#2b3039" />
  );
}
