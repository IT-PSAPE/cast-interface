import { describe, expect, it } from 'vitest';
import type { SlideElement } from '@core/types';
import { reorderElementStack } from './reorder-element-stack';

function createElement(input: Partial<SlideElement> & Pick<SlideElement, 'id' | 'layer' | 'type' | 'zIndex'>): SlideElement {
  return {
    id: input.id,
    slideId: input.slideId ?? 'slide-1',
    type: input.type,
    x: input.x ?? 0,
    y: input.y ?? 0,
    width: input.width ?? 100,
    height: input.height ?? 100,
    rotation: input.rotation ?? 0,
    opacity: input.opacity ?? 1,
    zIndex: input.zIndex,
    layer: input.layer,
    payload: input.payload ?? (input.type === 'text'
      ? {
        text: input.id,
        fontFamily: 'Avenir Next',
        fontSize: 48,
        color: '#FFFFFF',
        alignment: 'left',
        weight: '700',
      }
      : {
        fillColor: '#111111',
        borderColor: '#111111',
        borderWidth: 0,
        borderRadius: 0,
      }),
    createdAt: input.createdAt ?? '',
    updatedAt: input.updatedAt ?? '',
  };
}

describe('reorderElementStack', () => {
  it('reorders elements within the same layer from the object list display order', () => {
    const updates = reorderElementStack({
      elements: [
        createElement({ id: 'content-top', type: 'text', layer: 'content', zIndex: 2 }),
        createElement({ id: 'content-bottom', type: 'text', layer: 'content', zIndex: 1 }),
        createElement({ id: 'background', type: 'shape', layer: 'background', zIndex: 0 }),
      ],
      movingId: 'content-bottom',
      targetId: 'content-top',
      placement: 'before',
    });

    expect(updates).toEqual([
      { id: 'content-top', layer: 'content', zIndex: 0 },
      { id: 'content-bottom', layer: 'content', zIndex: 1 },
    ]);
  });

  it('moves elements into the target layer when dropped across layer boundaries', () => {
    const updates = reorderElementStack({
      elements: [
        createElement({ id: 'content', type: 'text', layer: 'content', zIndex: 0 }),
        createElement({ id: 'media', type: 'image', layer: 'media', zIndex: 0, payload: { src: '/media.png' } }),
        createElement({ id: 'background', type: 'shape', layer: 'background', zIndex: 0 }),
      ],
      movingId: 'background',
      targetId: 'media',
      placement: 'before',
    });

    expect(updates).toEqual([
      { id: 'background', layer: 'media', zIndex: 1 },
    ]);
  });
});
