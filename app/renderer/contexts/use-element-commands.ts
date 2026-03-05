import { useCallback } from 'react';
import type { AppSnapshot, ElementCreateInput, Id, LibraryBundle, MediaAsset, Presentation, Slide } from '@core/types';
import { fileSrc, getOverlayDefaults, typeFromFile } from '../utils/slides';

interface CommandsParams {
  activeBundle: LibraryBundle | null;
  currentSlide: Slide | null;
  currentPresentation: Presentation | null;
  mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
  setStatusText: (text: string) => void;
}

export function useElementCommands({ activeBundle, currentSlide, currentPresentation, mutate, setStatusText }: CommandsParams) {
  const isLyricsPresentation = currentPresentation?.kind === 'lyrics';

  const createText = useCallback(async () => {
    if (!currentSlide) return;
    if (isLyricsPresentation && activeBundle) {
      const existingLyricsText = activeBundle.slideElements.find((element) => {
        return element.slideId === currentSlide.id && element.type === 'text' && 'text' in element.payload;
      });
      if (existingLyricsText) {
        setStatusText('Lyrics presentations allow one text element per slide. Edit text in Outline view.');
        return;
      }
    }

    await mutate(() => window.castApi.createElement({
      slideId: currentSlide.id, type: 'text', x: 210, y: 460, width: 1500, height: 120,
      zIndex: 20, layer: 'content', payload: newTextPayload('New Text Element', 72, 'center', '700'),
    }));
    setStatusText('Added text element');
  }, [activeBundle, currentSlide, isLyricsPresentation, mutate, setStatusText]);

  const createShape = useCallback(async () => {
    if (!currentSlide) return;
    if (isLyricsPresentation) {
      setStatusText('Lyrics presentations only support one controllable text element.');
      return;
    }
    await mutate(() => window.castApi.createElement({
      slideId: currentSlide.id, type: 'shape', x: 260, y: 260, width: 1400, height: 560,
      zIndex: 2, layer: 'background', payload: newShapePayload(),
    }));
    setStatusText('Added shape element');
  }, [currentSlide, isLyricsPresentation, mutate, setStatusText]);

  const createFromMedia = useCallback(async (asset: MediaAsset, x: number, y: number) => {
    if (!currentSlide) return;
    if (isLyricsPresentation) {
      setStatusText('Lyrics presentations only support one controllable text element.');
      return;
    }
    let input: ElementCreateInput;
    if (asset.type === 'image') {
      input = { slideId: currentSlide.id, type: 'image', x, y, width: 640, height: 360, zIndex: 10, layer: 'media', payload: { src: asset.src } };
    } else if (asset.type === 'video' || asset.type === 'animation') {
      input = { slideId: currentSlide.id, type: 'video', x, y, width: 960, height: 540, zIndex: 10, layer: 'media', payload: { src: asset.src, autoplay: true, loop: true, muted: true } };
    } else {
      input = {
        slideId: currentSlide.id,
        type: 'text',
        x,
        y,
        width: 800,
        height: 90,
        zIndex: 12,
        layer: 'content',
        payload: newTextPayload(`[AUDIO] ${asset.name}`, 42, 'left', '600'),
      };
    }
    await mutate(() => window.castApi.createElement(input));
    setStatusText(`Added ${asset.type} element`);
  }, [currentSlide, isLyricsPresentation, mutate, setStatusText]);

  const createOverlay = useCallback(async () => {
    if (!activeBundle) return;
    await mutate(() => window.castApi.createOverlay(getOverlayDefaults(activeBundle.library.id)));
    setStatusText('Created overlay');
  }, [activeBundle, mutate, setStatusText]);

  const toggleOverlay = useCallback(async (overlayId: Id, enabled: boolean) => {
    await mutate(() => window.castApi.setOverlayEnabled(overlayId, enabled));
    setStatusText(enabled ? 'Overlay enabled' : 'Overlay disabled');
  }, [mutate, setStatusText]);

  const importMedia = useCallback(async (files: FileList) => {
    if (!activeBundle || files.length === 0) return;
    for (const file of Array.from(files)) {
      await mutate(() => window.castApi.createMediaAsset({
        libraryId: activeBundle.library.id, name: file.name, type: typeFromFile(file), src: fileSrc(file),
      }));
    }
    setStatusText('Media imported');
  }, [activeBundle, mutate, setStatusText]);

  const deleteMedia = useCallback(async (id: Id) => {
    await mutate(() => window.castApi.deleteMediaAsset(id));
    setStatusText('Media removed');
  }, [mutate, setStatusText]);

  const changeMediaSrc = useCallback(async (id: Id, file: File) => {
    await mutate(() => window.castApi.updateMediaAssetSrc(id, fileSrc(file)));
    setStatusText('Media source updated');
  }, [mutate, setStatusText]);

  return { createText, createShape, createFromMedia, createOverlay, toggleOverlay, importMedia, deleteMedia, changeMediaSrc };
}

function newTextPayload(text: string, fontSize: number, alignment: CanvasTextAlign | 'justify', weight: string) {
  return {
    text,
    fontFamily: 'Avenir Next',
    fontSize,
    color: '#FFFFFF',
    alignment,
    verticalAlign: 'middle' as const,
    lineHeight: 1.25,
    caseTransform: 'none' as const,
    weight,
    visible: true,
    locked: false,
    fillEnabled: true,
    strokeEnabled: false,
    shadowEnabled: false,
  };
}

function newShapePayload() {
  return {
    fillColor: '#172026C8',
    borderColor: '#FFFFFF44',
    borderWidth: 3,
    borderRadius: 24,
    visible: true,
    locked: false,
    fillEnabled: true,
    strokeEnabled: true,
    shadowEnabled: false,
  };
}
