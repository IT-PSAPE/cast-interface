import { useCallback } from 'react';
import { isLyricContentItem } from '@core/content-items';
import type { AppSnapshot, ContentItem, ElementCreateInput, Id, MediaAsset, Slide, SlideElement } from '@core/types';
import { castMediaSrc, getOverlayDefaults, typeFromFile } from '../../utils/slides';
import { createId } from '../../utils/create-id';
import { useOverlayDefaults } from '../overlay-defaults-context';
import { useOverlayEditor } from '../overlay-editor/overlay-editor-context';
import { useProjectContent } from '../use-project-content';
import { useSlideEditor } from '../slide-editor-context';
import { useTemplateEditor } from '../template-editor-context';
import { useWorkbench } from '../workbench-context';

interface CommandsParams {
  currentSlide: Slide | null;
  currentContentItem: ContentItem | null;
  currentTemplate: { id: Id; kind: 'slides' | 'lyrics' | 'overlays'; elements: SlideElement[] } | null;
  mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
  setStatusText: (text: string) => void;
}

export function useElementCommands({ currentSlide, currentContentItem, currentTemplate, mutate, setStatusText }: CommandsParams) {
  const { overlayDefaults } = useOverlayDefaults();
  const isLyricItem = isLyricContentItem(currentContentItem);
  const { currentOverlay, updateOverlayDraft } = useOverlayEditor();
  const { getSlideElements, replaceSlideElements } = useSlideEditor();
  const { replaceTemplateElements } = useTemplateEditor();
  const { slideElementsBySlideId } = useProjectContent();
  const { state: { workbenchMode } } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isSlideEdit = workbenchMode === 'slide-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';
  const isLyricsTemplate = currentTemplate?.kind === 'lyrics';
  const existingTemplateTextElement = currentTemplate?.elements.find((element) => element.type === 'text') ?? null;

  function resolvePersistentMediaSource(file: File): string | null {
    const filePath = window.castApi.getPathForFile(file);
    if (!filePath) return null;
    return castMediaSrc(filePath);
  }

  const createText = useCallback(async () => {
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      const nextElements = [
        ...currentOverlay.elements,
        {
          id: createId(),
          slideId: currentOverlay.id,
          type: 'text' as const,
          x: 210,
          y: 460,
          width: 1500,
          height: 120,
          rotation: 0,
          opacity: 1,
          zIndex: nextOverlayZIndex(currentOverlay.elements, 20),
          layer: 'content' as const,
          payload: newTextPayload('New Overlay Text', 72, 'center', '700'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      updateOverlayDraft({ id: currentOverlay.id, elements: nextElements });
      setStatusText('Added overlay text');
      return;
    }
    if (isTemplateEdit) {
      if (!currentTemplate) return;
      if (isLyricsTemplate && existingTemplateTextElement) {
        setStatusText('Lyric templates only support the existing lyric text element.');
        return;
      }
      replaceTemplateElements([
        ...currentTemplate.elements,
        newSlideTextElement(currentTemplate.id),
      ]);
      setStatusText('Added template text');
      return;
    }
    if (!currentSlide) return;
    if (isLyricItem) {
      const existingLyricsText = (slideElementsBySlideId.get(currentSlide.id) ?? []).find((element) => {
        return element.slideId === currentSlide.id && element.type === 'text' && 'text' in element.payload;
      });
      if (existingLyricsText) {
        setStatusText('Lyrics keep one text element per slide. Edit text in Outline view.');
        return;
      }
    }
    if (isSlideEdit) {
      const nextElements = [
        ...getSlideElements(currentSlide.id),
        newSlideTextElement(currentSlide.id),
      ];
      replaceSlideElements(currentSlide.id, nextElements);
      setStatusText('Added text element');
      return;
    }

    await mutate(() => window.castApi.createElement({
      slideId: currentSlide.id, type: 'text', x: 210, y: 460, width: 1500, height: 120,
      zIndex: 20, layer: 'content', payload: newTextPayload('New Text Element', 72, 'center', '700'),
    }));
    setStatusText('Added text element');
  }, [currentOverlay, currentSlide, currentTemplate, existingTemplateTextElement, getSlideElements, isLyricItem, isLyricsTemplate, isOverlayEdit, isSlideEdit, isTemplateEdit, mutate, replaceSlideElements, replaceTemplateElements, setStatusText, slideElementsBySlideId]);

  const createShape = useCallback(async () => {
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      const nextElements = [
        ...currentOverlay.elements,
        {
          id: createId(),
          slideId: currentOverlay.id,
          type: 'shape' as const,
          x: 260,
          y: 260,
          width: 1400,
          height: 560,
          rotation: 0,
          opacity: 1,
          zIndex: nextOverlayZIndex(currentOverlay.elements, 2),
          layer: 'content' as const,
          payload: newShapePayload(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      updateOverlayDraft({ id: currentOverlay.id, elements: nextElements });
      setStatusText('Added overlay shape');
      return;
    }
    if (isTemplateEdit) {
      if (!currentTemplate) return;
      replaceTemplateElements([
        ...currentTemplate.elements,
        newSlideShapeElement(currentTemplate.id),
      ]);
      setStatusText('Added template shape');
      return;
    }
    if (!currentSlide) return;
    if (isSlideEdit) {
      const nextElements = [
        ...getSlideElements(currentSlide.id),
        newSlideShapeElement(currentSlide.id),
      ];
      replaceSlideElements(currentSlide.id, nextElements);
      setStatusText('Added shape element');
      return;
    }
    await mutate(() => window.castApi.createElement({
      slideId: currentSlide.id, type: 'shape', x: 260, y: 260, width: 1400, height: 560,
      zIndex: 2, layer: 'background', payload: newShapePayload(),
    }));
    setStatusText('Added shape element');
  }, [currentOverlay, currentSlide, currentTemplate, getSlideElements, isOverlayEdit, isSlideEdit, isTemplateEdit, mutate, replaceSlideElements, replaceTemplateElements, setStatusText]);

  const createFromMedia = useCallback(async (asset: MediaAsset, x: number, y: number) => {
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      const nextElements = [
        ...currentOverlay.elements,
        {
          id: createId(),
          slideId: currentOverlay.id,
          type: asset.type === 'video' || asset.type === 'animation' ? 'video' as const : 'image' as const,
          x,
          y,
          width: asset.type === 'image' ? 640 : 960,
          height: asset.type === 'image' ? 360 : 540,
          rotation: 0,
          opacity: 1,
          zIndex: nextOverlayZIndex(currentOverlay.elements, 10),
          layer: 'content' as const,
          payload: asset.type === 'video' || asset.type === 'animation'
            ? { src: asset.src, autoplay: true, loop: true, muted: true }
            : { src: asset.src },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      updateOverlayDraft({ id: currentOverlay.id, elements: nextElements });
      setStatusText(`Added ${asset.type} overlay`);
      return;
    }
    if (isTemplateEdit) {
      if (!currentTemplate) return;
      replaceTemplateElements([
        ...currentTemplate.elements,
        newSlideMediaElement(currentTemplate.id, asset, x, y),
      ]);
      setStatusText(`Added ${asset.type} template element`);
      return;
    }
    if (!currentSlide) return;
    if (isSlideEdit) {
      const nextElements = [
        ...getSlideElements(currentSlide.id),
        newSlideMediaElement(currentSlide.id, asset, x, y),
      ];
      replaceSlideElements(currentSlide.id, nextElements);
      setStatusText(`Added ${asset.type} element`);
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
  }, [currentOverlay, currentSlide, currentTemplate, getSlideElements, isOverlayEdit, isSlideEdit, isTemplateEdit, mutate, replaceSlideElements, replaceTemplateElements, setStatusText]);

  const createOverlay = useCallback(async () => {
    await mutate(() => window.castApi.createOverlay(getOverlayDefaults({
      animationKind: overlayDefaults.animationKind,
      durationMs: overlayDefaults.durationMs,
      autoClearDurationMs: overlayDefaults.autoClearDurationMs,
    })));
    setStatusText('Created overlay');
  }, [mutate, overlayDefaults.autoClearDurationMs, overlayDefaults.animationKind, overlayDefaults.durationMs, setStatusText]);

  const toggleOverlay = useCallback(async (overlayId: Id, enabled: boolean) => {
    await mutate(() => window.castApi.setOverlayEnabled(overlayId, enabled));
    setStatusText(enabled ? 'Overlay enabled' : 'Overlay disabled');
  }, [mutate, setStatusText]);

  const importMedia = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    let importedCount = 0;
    let skippedCount = 0;
    for (const file of Array.from(files)) {
      const src = resolvePersistentMediaSource(file);
      if (!src) {
        skippedCount += 1;
        continue;
      }
      await mutate(() => window.castApi.createMediaAsset({
        name: file.name, type: typeFromFile(file), src,
      }));
      importedCount += 1;
    }
    if (importedCount > 0 && skippedCount === 0) {
      setStatusText('Media imported');
      return;
    }
    if (importedCount > 0) {
      setStatusText(`Imported ${importedCount} media item(s); skipped ${skippedCount} item(s) without file paths.`);
      return;
    }
    setStatusText('No media imported. Selected files did not expose absolute file paths.');
  }, [mutate, setStatusText]);

  const deleteMedia = useCallback(async (id: Id) => {
    await mutate(() => window.castApi.deleteMediaAsset(id));
    setStatusText('Media removed');
  }, [mutate, setStatusText]);

  const changeMediaSrc = useCallback(async (id: Id, file: File) => {
    const src = resolvePersistentMediaSource(file);
    if (!src) {
      setStatusText('Media source not updated. Selected file did not expose an absolute file path.');
      return;
    }
    await mutate(() => window.castApi.updateMediaAssetSrc(id, src));
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
    fillEnabled: false,
    fillColor: '#00000000',
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

function nextOverlayZIndex(elements: { zIndex: number }[], fallback: number): number {
  if (elements.length === 0) return fallback;
  return Math.max(...elements.map((element) => element.zIndex)) + 1;
}

function newSlideTextElement(slideId: Id) {
  const timestamp = new Date().toISOString();
  return {
    id: createId(),
    slideId,
    type: 'text' as const,
    x: 210,
    y: 460,
    width: 1500,
    height: 120,
    rotation: 0,
    opacity: 1,
    zIndex: 20,
    layer: 'content' as const,
    payload: newTextPayload('New Text Element', 72, 'center', '700'),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function newSlideShapeElement(slideId: Id) {
  const timestamp = new Date().toISOString();
  return {
    id: createId(),
    slideId,
    type: 'shape' as const,
    x: 260,
    y: 260,
    width: 1400,
    height: 560,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    layer: 'background' as const,
    payload: newShapePayload(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function newSlideMediaElement(slideId: Id, asset: MediaAsset, x: number, y: number) {
  const timestamp = new Date().toISOString();
  if (asset.type === 'image') {
    return {
      id: createId(),
      slideId,
      type: 'image' as const,
      x,
      y,
      width: 640,
      height: 360,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      layer: 'media' as const,
      payload: { src: asset.src },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
  if (asset.type === 'video' || asset.type === 'animation') {
    return {
      id: createId(),
      slideId,
      type: 'video' as const,
      x,
      y,
      width: 960,
      height: 540,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      layer: 'media' as const,
      payload: { src: asset.src, autoplay: true, loop: true, muted: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
  return {
    id: createId(),
    slideId,
    type: 'text' as const,
    x,
    y,
    width: 800,
    height: 90,
    rotation: 0,
    opacity: 1,
    zIndex: 12,
    layer: 'content' as const,
    payload: newTextPayload(`[AUDIO] ${asset.name}`, 42, 'left', '600'),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
