import { readVisualPayload } from '@core/element-payload';
import { LAYER_PREVIEW_SLIDE, mediaAssetToLayerElement, overlayToLayerElements } from '@core/presentation-layers';
import type { MediaAsset, Overlay, Slide, SlideElement } from '@core/types';
import { sortElements } from '../../utils/slides';
import type { RenderNode, RenderScene } from './scene-types';

function toRenderNode(element: SlideElement): RenderNode {
  return {
    id: element.id,
    element,
    visual: readVisualPayload(element.type, element.payload),
    isVideo: element.type === 'video',
  };
}

function resolveSceneSlide(slide: Slide | null): Slide {
  return slide ?? LAYER_PREVIEW_SLIDE;
}

function sceneSize(slide: Slide): { width: number; height: number } {
  return {
    width: Math.max(1, slide.width || 1920),
    height: Math.max(1, slide.height || 1080),
  };
}

function toPresentationLayerElement(element: SlideElement): SlideElement {
  if (element.layer === 'content') return element;
  return {
    ...element,
    layer: 'content',
  };
}

export function buildRenderScene(slide: Slide | null, elements: SlideElement[]): RenderScene {
  const nextSlide = resolveSceneSlide(slide);
  const size = sceneSize(nextSlide);
  const sorted = sortElements(elements).map(toRenderNode);
  return { slide: nextSlide, width: size.width, height: size.height, nodes: sorted };
}

interface LayeredSceneInput {
  slide: Slide | null;
  contentElements: SlideElement[];
  mediaAsset: MediaAsset | null;
  overlays: Array<{
    overlay: Overlay;
    opacityMultiplier: number;
    stackOrder: number;
  }>;
  includeContent: boolean;
}

const OVERLAY_LAYER_Z_INDEX_OFFSET = 10000;
const OVERLAY_STACK_Z_INDEX_OFFSET = 1000;

export function buildLayeredRenderScene({ slide, contentElements, mediaAsset, overlays, includeContent }: LayeredSceneInput): RenderScene {
  const merged: SlideElement[] = [];
  if (mediaAsset) merged.push(mediaAssetToLayerElement(mediaAsset));
  if (includeContent) merged.push(...contentElements.map(toPresentationLayerElement));

  for (const overlayLayer of overlays) {
    if (overlayLayer.opacityMultiplier <= 0) continue;
    merged.push(...overlayToLayerElements(overlayLayer.overlay).map((element) => ({
      ...element,
      opacity: element.opacity * overlayLayer.opacityMultiplier,
      zIndex: element.zIndex + OVERLAY_LAYER_Z_INDEX_OFFSET + (overlayLayer.stackOrder * OVERLAY_STACK_Z_INDEX_OFFSET),
    })));
  }
  return buildRenderScene(slide, merged);
}

export function buildThumbnailScene(slide: Slide, slideElements: SlideElement[]): RenderScene {
  return buildRenderScene(slide, slideElements);
}
