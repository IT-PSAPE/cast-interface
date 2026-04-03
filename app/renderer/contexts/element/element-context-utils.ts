import type { SlideElement } from '@core/types';
import type { ElementInspectorDraft } from '../../types/ui';

export function payloadSignature(payload: SlideElement['payload'] | null): string {
  return JSON.stringify(payload ?? null);
}

export function hasGeometryChange(base: SlideElement, draft: ElementInspectorDraft): boolean {
  return base.x !== draft.x || base.y !== draft.y || base.width !== draft.width || base.height !== draft.height || base.rotation !== draft.rotation || base.opacity !== draft.opacity || base.zIndex !== draft.zIndex;
}

export function cloneElement(element: SlideElement): SlideElement {
  return JSON.parse(JSON.stringify(element)) as SlideElement;
}

export function cloneElements(elements: SlideElement[]): SlideElement[] {
  return elements.map(cloneElement);
}

export function sameElementState(a: SlideElement, b: SlideElement): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.rotation === b.rotation &&
    a.opacity === b.opacity &&
    a.zIndex === b.zIndex &&
    a.layer === b.layer &&
    payloadSignature(a.payload) === payloadSignature(b.payload)
  );
}
