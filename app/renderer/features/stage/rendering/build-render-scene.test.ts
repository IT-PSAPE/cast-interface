import { describe, expect, it } from 'vitest';
import type { Slide, SlideElement } from '@core/types';
import type { MediaAsset, Overlay } from '@core/types';
import { buildLayeredRenderScene, buildRenderScene } from './build-render-scene';

function slide(): Slide {
  return {
    id: 'slide-1',
    presentationId: 'p-1',
    width: 1920,
    height: 1080,
    notes: '',
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

  it('renders assigned show media behind all slide content in the layered preview', () => {
    const mediaAsset: MediaAsset = {
      id: 'asset-1',
      name: 'Background',
      type: 'image',
      src: '/background.png',
      createdAt: '',
      updatedAt: '',
    };

    const overlay: Overlay = {
      id: 'overlay-1',
      name: 'Overlay',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      opacity: 1,
      zIndex: 999,
      enabled: true,
      payload: { text: 'Live', fontFamily: 'Arial', fontSize: 24, color: '#fff', alignment: 'left' },
      elements: [
        {
          id: 'overlay-1',
          slideId: 'overlay-1',
          type: 'text',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          opacity: 1,
          zIndex: 999,
          layer: 'content',
          payload: { text: 'Live', fontFamily: 'Arial', fontSize: 24, color: '#fff', alignment: 'left' },
          createdAt: '',
          updatedAt: '',
        },
      ],
      animation: { kind: 'none', durationMs: 0, autoClearDurationMs: null },
      createdAt: '',
      updatedAt: '',
    };

    const scene = buildLayeredRenderScene({
      slide: slide(),
      contentElements: [
        element({ id: 'shape-1', type: 'shape', layer: 'background', zIndex: 1, payload: { fillColor: '#000', borderColor: '#000', borderWidth: 0, borderRadius: 0 } }),
        element({ id: 'text-1', type: 'text', layer: 'content', zIndex: 2 }),
      ],
      mediaAsset,
      overlays: [{ overlay, opacityMultiplier: 1, stackOrder: 0 }],
      includeContent: true,
    });

    expect(scene.nodes.map((node) => node.id)).toEqual(['__layer_media_asset-1', 'shape-1', 'text-1', 'overlay-1']);
  });
});
