import type { SlideElement } from './types';

export function cloneElement(element: SlideElement): SlideElement {
  return JSON.parse(JSON.stringify(element)) as SlideElement;
}

export function cloneElements(elements: SlideElement[]): SlideElement[] {
  return elements.map(cloneElement);
}
