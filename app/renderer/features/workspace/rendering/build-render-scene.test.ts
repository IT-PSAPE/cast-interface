import { describe, expect, it } from 'vitest';
import type { Slide, SlideElement } from '@core/types';
import { buildRenderScene } from './build-render-scene';

function slide(): Slide {
  return {
    id: 'slide-1',
    presentationId: 'p-1',
    width: 1920,
    height: 1080,
    order: 0,
    createdAt: '',
    updatedAt: '',
  };
}

function element(input: Partial<SlideElement> & { id: string; type: SlideElement['type']; layer: SlideElement['layer']; zIndex: number }): SlideElement {
  return {
    id: input.id,
    slideId: 'slide-1',
    type: input.type,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: input.zIndex,
    layer: input.layer,
    payload: input.payload ?? { text: 'x', fontFamily: 'Arial', fontSize: 24, color: '#fff', alignment: 'left' },
    createdAt: '',
    updatedAt: '',
  } as SlideElement;
}

describe('buildRenderScene', () => {
  it('orders nodes by layer then z-index', () => {
    const scene = buildRenderScene(slide(), [
      element({ id: 'content-1', type: 'text', layer: 'content', zIndex: 1 }),
      element({ id: 'background-10', type: 'shape', layer: 'background', zIndex: 10, payload: { fillColor: '#000', borderColor: '#000', borderWidth: 0, borderRadius: 0 } }),
      element({ id: 'media-3', type: 'image', layer: 'media', zIndex: 3, payload: { src: '/a.png' } }),
      element({ id: 'background-1', type: 'shape', layer: 'background', zIndex: 1, payload: { fillColor: '#000', borderColor: '#000', borderWidth: 0, borderRadius: 0 } }),
    ]);

    expect(scene.nodes.map((node) => node.id)).toEqual(['background-1', 'background-10', 'media-3', 'content-1']);
  });
});
