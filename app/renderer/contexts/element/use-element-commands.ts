import { useCallback } from 'react';
import { isLyricDeckItem } from '@core/deck-items';
import type { AppSnapshot, DeckItem, ElementCreateInput, Id, MediaAsset, Slide, SlideElement } from '@core/types';
import type { SnapshotPatch } from '@core/snapshot-patch';
import { castMediaSrc, getOverlayDefaults, typeFromFile } from '../../utils/slides';
import { useOverlayEditor, useDeckEditor, useTemplateEditor } from '../asset-editor/asset-editor-context';
import { useProjectContent } from '../use-project-content';
import { useWorkbench } from '../workbench-context';
import {
  newOverlayElement,
  newShapePayload,
  newSlideMediaElement,
  newSlideShapeElement,
  newSlideTextElement,
  newTextPayload,
  nextOverlayZIndex,
} from './element-factory';

interface CommandsParams {
  currentSlide: Slide | null;
  currentDeckItem: DeckItem | null;
  currentTemplate: { id: Id; kind: 'slides' | 'lyrics' | 'overlays'; elements: SlideElement[] } | null;
  mutatePatch: (action: () => Promise<SnapshotPatch>) => Promise<AppSnapshot>;
  setStatusText: (text: string) => void;
}

export function useElementCommands({ currentSlide, currentDeckItem, currentTemplate, mutatePatch, setStatusText }: CommandsParams) {
  const { state: { overlayDefaults } } = useWorkbench();
  const isLyricItem = isLyricDeckItem(currentDeckItem);
  const { currentOverlay, updateOverlayDraft } = useOverlayEditor();
  const { getSlideElements, replaceSlideElements } = useDeckEditor();
  const { replaceTemplateElements } = useTemplateEditor();
  const { slideElementsBySlideId } = useProjectContent();
  const { state: { workbenchMode } } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isSlideEdit = workbenchMode === 'deck-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';
  const isLyricsTemplate = currentTemplate?.kind === 'lyrics';
  const existingTemplateTextElement = currentTemplate?.elements.find((element) => element.type === 'text') ?? null;

  function resolvePersistentMediaSource(file: File): string | null {
    const filePath = window.castApi.getPathForFile(file);
    if (!filePath) return null;
    return castMediaSrc(filePath);
  }

  function addToOverlay(element: SlideElement) {
    if (!currentOverlay) return;
    updateOverlayDraft({ id: currentOverlay.id, elements: [...currentOverlay.elements, element] });
  }

  function addToTemplate(element: SlideElement) {
    if (!currentTemplate) return;
    replaceTemplateElements([...currentTemplate.elements, element]);
  }

  function addToSlideEdit(slideId: Id, element: SlideElement) {
    replaceSlideElements(slideId, [...getSlideElements(slideId), element]);
  }

  const createText = useCallback(async () => {
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      addToOverlay(newOverlayElement(currentOverlay.id, 'text', 210, 460, 1500, 120, nextOverlayZIndex(currentOverlay.elements, 20), newTextPayload('New Overlay Text', 72, 'center', '700')));
      setStatusText('Added overlay text');
      return;
    }
    if (isTemplateEdit) {
      if (!currentTemplate) return;
      if (isLyricsTemplate && existingTemplateTextElement) {
        setStatusText('Lyric templates only support the existing lyric text element.');
        return;
      }
      addToTemplate(newSlideTextElement(currentTemplate.id));
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
      addToSlideEdit(currentSlide.id, newSlideTextElement(currentSlide.id));
      setStatusText('Added text element');
      return;
    }
    await mutatePatch(() => window.castApi.createElement({
      slideId: currentSlide.id, type: 'text', x: 210, y: 460, width: 1500, height: 120,
      zIndex: 20, layer: 'content', payload: newTextPayload('New Text Element', 72, 'center', '700'),
    }));
    setStatusText('Added text element');
  }, [currentOverlay, currentSlide, currentTemplate, existingTemplateTextElement, getSlideElements, isLyricItem, isLyricsTemplate, isOverlayEdit, isSlideEdit, isTemplateEdit, mutatePatch, replaceSlideElements, replaceTemplateElements, setStatusText, slideElementsBySlideId, updateOverlayDraft]);

  const createShape = useCallback(async () => {
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      addToOverlay(newOverlayElement(currentOverlay.id, 'shape', 260, 260, 1400, 560, nextOverlayZIndex(currentOverlay.elements, 2), newShapePayload()));
      setStatusText('Added overlay shape');
      return;
    }
    if (isTemplateEdit) {
      if (!currentTemplate) return;
      addToTemplate(newSlideShapeElement(currentTemplate.id));
      setStatusText('Added template shape');
      return;
    }
    if (!currentSlide) return;
    if (isSlideEdit) {
      addToSlideEdit(currentSlide.id, newSlideShapeElement(currentSlide.id));
      setStatusText('Added shape element');
      return;
    }
    await mutatePatch(() => window.castApi.createElement({
      slideId: currentSlide.id, type: 'shape', x: 260, y: 260, width: 1400, height: 560,
      zIndex: 2, layer: 'background', payload: newShapePayload(),
    }));
    setStatusText('Added shape element');
  }, [currentOverlay, currentSlide, currentTemplate, getSlideElements, isOverlayEdit, isSlideEdit, isTemplateEdit, mutatePatch, replaceSlideElements, replaceTemplateElements, setStatusText, updateOverlayDraft]);

  const createFromMedia = useCallback(async (asset: MediaAsset, x: number, y: number) => {
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      const elementType = asset.type === 'video' || asset.type === 'animation' ? 'video' as const : 'image' as const;
      const w = asset.type === 'image' ? 640 : 960;
      const h = asset.type === 'image' ? 360 : 540;
      const payload = asset.type === 'video' || asset.type === 'animation'
        ? { src: asset.src, autoplay: true, loop: true, muted: true }
        : { src: asset.src };
      addToOverlay(newOverlayElement(currentOverlay.id, elementType, x, y, w, h, nextOverlayZIndex(currentOverlay.elements, 10), payload));
      setStatusText(`Added ${asset.type} overlay`);
      return;
    }
    if (isTemplateEdit) {
      if (!currentTemplate) return;
      addToTemplate(newSlideMediaElement(currentTemplate.id, asset, x, y));
      setStatusText(`Added ${asset.type} template element`);
      return;
    }
    if (!currentSlide) return;
    if (isSlideEdit) {
      addToSlideEdit(currentSlide.id, newSlideMediaElement(currentSlide.id, asset, x, y));
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
    await mutatePatch(() => window.castApi.createElement(input));
    setStatusText(`Added ${asset.type} element`);
  }, [currentOverlay, currentSlide, currentTemplate, getSlideElements, isOverlayEdit, isSlideEdit, isTemplateEdit, mutatePatch, replaceSlideElements, replaceTemplateElements, setStatusText, updateOverlayDraft]);

  const createOverlay = useCallback(async () => {
    await mutatePatch(() => window.castApi.createOverlay(getOverlayDefaults({
      animationKind: overlayDefaults.animationKind,
      durationMs: overlayDefaults.durationMs,
      autoClearDurationMs: overlayDefaults.autoClearDurationMs,
    })));
    setStatusText('Created overlay');
  }, [mutatePatch, overlayDefaults.autoClearDurationMs, overlayDefaults.animationKind, overlayDefaults.durationMs, setStatusText]);

  const toggleOverlay = useCallback(async (overlayId: Id, enabled: boolean) => {
    await mutatePatch(() => window.castApi.setOverlayEnabled(overlayId, enabled));
    setStatusText(enabled ? 'Overlay enabled' : 'Overlay disabled');
  }, [mutatePatch, setStatusText]);

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
      await mutatePatch(() => window.castApi.createMediaAsset({
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
  }, [mutatePatch, setStatusText]);

  const deleteMedia = useCallback(async (id: Id) => {
    await mutatePatch(() => window.castApi.deleteMediaAsset(id));
    setStatusText('Media removed');
  }, [mutatePatch, setStatusText]);

  const changeMediaSrc = useCallback(async (id: Id, file: File) => {
    const src = resolvePersistentMediaSource(file);
    if (!src) {
      setStatusText('Media source not updated. Selected file did not expose an absolute file path.');
      return;
    }
    await mutatePatch(() => window.castApi.updateMediaAssetSrc(id, src));
    setStatusText('Media source updated');
  }, [mutatePatch, setStatusText]);

  return { createText, createShape, createFromMedia, createOverlay, toggleOverlay, importMedia, deleteMedia, changeMediaSrc };
}
