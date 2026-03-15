import type { ElementUpdateInput, Id, SlideElement } from '@core/types';
import { LAYER_ORDER } from '../../../types/ui';

export type StackDropPlacement = 'before' | 'after';

interface ReorderElementStackInput {
  elements: SlideElement[];
  movingId: Id;
  targetId: Id;
  placement: StackDropPlacement;
}

const DISPLAY_LAYERS = Object.entries(LAYER_ORDER)
  .sort((left, right) => right[1] - left[1])
  .map(([layer]) => layer as SlideElement['layer']);

export function reorderElementStack({ elements, movingId, targetId, placement }: ReorderElementStackInput): ElementUpdateInput[] {
  if (movingId === targetId) return [];

  const displayElements = sortDisplayElements(elements);
  const movingElement = displayElements.find((element) => element.id === movingId);
  const targetElement = displayElements.find((element) => element.id === targetId);

  if (!movingElement || !targetElement) return [];

  const remainingElements = displayElements.filter((element) => element.id !== movingId);
  const targetIndex = remainingElements.findIndex((element) => element.id === targetId);
  if (targetIndex === -1) return [];

  const insertionIndex = placement === 'after' ? targetIndex + 1 : targetIndex;
  const nextDisplayElements = remainingElements.slice();
  nextDisplayElements.splice(insertionIndex, 0, {
    ...movingElement,
    layer: targetElement.layer,
  });

  return buildReorderUpdates(elements, displayElements, nextDisplayElements);
}

function buildReorderUpdates(
  sourceElements: SlideElement[],
  currentDisplayElements: SlideElement[],
  nextDisplayElements: SlideElement[],
): ElementUpdateInput[] {
  const currentLayout = normalizeDisplayLayout(currentDisplayElements);
  const nextLayout = normalizeDisplayLayout(nextDisplayElements);

  return sourceElements.flatMap((element) => {
    const currentPosition = currentLayout.get(element.id);
    const nextPosition = nextLayout.get(element.id);

    if (!currentPosition || !nextPosition) return [];
    if (currentPosition.layer === nextPosition.layer && currentPosition.zIndex === nextPosition.zIndex) return [];

    return [{
      id: element.id,
      layer: nextPosition.layer,
      zIndex: nextPosition.zIndex,
    }];
  });
}

function normalizeDisplayLayout(displayElements: SlideElement[]): Map<Id, Pick<SlideElement, 'layer' | 'zIndex'>> {
  const normalized = new Map<Id, Pick<SlideElement, 'layer' | 'zIndex'>>();

  for (const layer of DISPLAY_LAYERS) {
    const layerElements = displayElements.filter((element) => element.layer === layer);
    const maxIndex = layerElements.length - 1;

    layerElements.forEach((element, index) => {
      normalized.set(element.id, {
        layer,
        zIndex: maxIndex - index,
      });
    });
  }

  return normalized;
}

function sortDisplayElements(elements: SlideElement[]): SlideElement[] {
  return elements.slice().sort((left, right) => {
    const layerDiff = LAYER_ORDER[right.layer] - LAYER_ORDER[left.layer];
    if (layerDiff !== 0) return layerDiff;
    return right.zIndex - left.zIndex;
  });
}
