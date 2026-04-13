import type { MediaAsset, Overlay, Slide, SlideElement } from './types';

export const OUTPUT_FRAME_WIDTH = 1920;
export const OUTPUT_FRAME_HEIGHT = 1080;

export const LAYER_PREVIEW_SLIDE: Slide = {
  id: '__layer_preview__',
  presentationId: null,
  lyricId: null,
  width: OUTPUT_FRAME_WIDTH,
  height: OUTPUT_FRAME_HEIGHT,
  notes: '',
  order: 0,
  createdAt: '',
  updatedAt: '',
};

export function mediaAssetToLayerElement(asset: MediaAsset): SlideElement {
  if (asset.type === 'audio') {
    return {
      id: '__layer_media',
      slideId: LAYER_PREVIEW_SLIDE.id,
      type: 'text',
      x: 0,
      y: 450,
      width: OUTPUT_FRAME_WIDTH,
      height: 180,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
      layer: 'media',
      payload: {
        text: `[AUDIO] ${asset.name}`,
        fontFamily: 'Avenir Next',
        fontSize: 58,
        color: '#FFFFFF',
        alignment: 'center',
        verticalAlign: 'middle',
        lineHeight: 1.2,
        weight: '700',
      },
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  const isVideo = asset.type === 'video' || asset.type === 'animation';

  return {
    id: '__layer_media',
    slideId: LAYER_PREVIEW_SLIDE.id,
    type: isVideo ? 'video' : 'image',
    x: 0,
    y: 0,
    width: OUTPUT_FRAME_WIDTH,
    height: OUTPUT_FRAME_HEIGHT,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    layer: 'media',
    payload: isVideo
      ? { src: asset.src, autoplay: true, loop: true, muted: true }
      : { src: asset.src },
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

export function overlayToLayerElements(overlay: Overlay): SlideElement[] {
  if (!overlay.elements || overlay.elements.length === 0) {
    return [{
      id: overlay.id,
      slideId: '__overlay__',
      type: overlay.type === 'shape' ? 'shape' : overlay.type === 'text' ? 'text' : overlay.type === 'video' ? 'video' : 'image',
      x: overlay.x,
      y: overlay.y,
      width: overlay.width,
      height: overlay.height,
      rotation: 0,
      opacity: overlay.opacity,
      zIndex: overlay.zIndex,
      layer: 'content',
      payload: overlay.payload,
      createdAt: overlay.createdAt,
      updatedAt: overlay.updatedAt,
    }];
  }

  return overlay.elements.map((element) => ({
    ...element,
    slideId: '__overlay__',
    layer: 'content',
  }));
}
