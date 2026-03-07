import type { ElementUpdateInput, Id, SlideElement } from '@core/types';

export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function toNodeRect(element: SlideElement): NodeRect {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
  };
}

export function toUpdateInput(id: Id, rect: NodeRect): ElementUpdateInput {
  return {
    id,
    x: rect.x,
    y: rect.y,
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
    rotation: rect.rotation,
  };
}

export function nudgeElement(element: SlideElement, dx: number, dy: number): ElementUpdateInput {
  return {
    id: element.id,
    x: element.x + dx,
    y: element.y + dy,
  };
}

export function patchFromScale(element: SlideElement, x: number, y: number, width: number, height: number, rotation: number): ElementUpdateInput {
  return {
    id: element.id,
    x,
    y,
    width: Math.max(1, width),
    height: Math.max(1, height),
    rotation,
  };
}
