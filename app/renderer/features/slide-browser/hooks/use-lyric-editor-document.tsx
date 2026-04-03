import { useCallback, useMemo, useState } from 'react';
import type { ElementCreateInput, Id, SlideElement } from '@core/types';
import type { Block } from '../../../components/doc-editor';
import { useCast } from '../../../contexts/cast-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlides } from '../../../contexts/slide-context';
import { slideTextDetails } from '../../../utils/slides';

function findTextElement(elements: SlideElement[]): SlideElement | null {
  return elements.find((element) => element.type === 'text' && 'text' in element.payload) ?? null;
}

function createFallbackLyricTextElement(slideId: Id, text: string): ElementCreateInput {
  return {
    slideId,
    type: 'text',
    x: 180,
    y: 860,
    width: 1560,
    height: 170,
    payload: {
      text,
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      verticalAlign: 'middle',
      lineHeight: 1.2,
      caseTransform: 'none',
      weight: '700',
      visible: true,
      locked: false,
      fillEnabled: false,
      fillColor: '#00000000',
      strokeEnabled: false,
      shadowEnabled: false,
    },
  };
}

export function useLyricEditorSave({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentContentItem } = useNavigation();
  const { slides } = useSlides();
  const { slideElementsBySlideId } = useProjectContent();
  const { mutate, setStatusText } = useCast();
  const [isSaving, setIsSaving] = useState(false);

  const initialBlocks = useMemo<Block[]>(() => {
    if (!isOpen || !currentContentItem || currentContentItem.type !== 'lyric') return [];
    return slides.map((slide) => ({
      id: slide.id,
      content: slideTextDetails(slideElementsBySlideId.get(slide.id) ?? []).text,
    }));
  }, [isOpen, currentContentItem, slideElementsBySlideId, slides]);

  const slideIds = useMemo(() => new Set(slides.map((s) => s.id)), [slides]);

  const saveRowText = useCallback(async (slideId: Id, text: string, currentElements: SlideElement[]) => {
    const textElement = findTextElement(currentElements);
    if (textElement && 'text' in textElement.payload) {
      const currentText = String(textElement.payload.text ?? '');
      if (currentText !== text) {
        await mutate(() => window.castApi.updateElement({
          id: textElement.id,
          payload: { ...textElement.payload, text },
        }));
      }
      return;
    }
    await mutate(() => window.castApi.createElement(createFallbackLyricTextElement(slideId, text)));
  }, [mutate]);

  const createSlideForRow = useCallback(async (lyricId: Id, text: string) => {
    const snapshot = await mutate(() => window.castApi.createSlide({ lyricId }));
    const nextSlide = snapshot.slides
      .filter((slide) => slide.lyricId === lyricId)
      .sort((left, right) => right.order - left.order)
      .at(0);

    if (!nextSlide) throw new Error('Unable to create lyric slide.');

    const nextSlideElements = snapshot.slideElements.filter((element) => element.slideId === nextSlide.id);
    await saveRowText(nextSlide.id, text, nextSlideElements);
    return nextSlide.id;
  }, [mutate, saveRowText]);

  const saveBlocks = useCallback(async (blocks: Block[]) => {
    if (!currentContentItem || currentContentItem.type !== 'lyric') return;

    setIsSaving(true);

    try {
      const removedSlideIds = slides
        .filter((slide) => !blocks.some((block) => block.id === slide.id))
        .map((slide) => slide.id);

      for (const slideId of removedSlideIds) {
        await mutate(() => window.castApi.deleteSlide(slideId));
      }

      const orderedSlideIds: Id[] = [];

      for (const block of blocks) {
        if (slideIds.has(block.id)) {
          await saveRowText(block.id, block.content, slideElementsBySlideId.get(block.id) ?? []);
          orderedSlideIds.push(block.id);
        } else {
          const createdSlideId = await createSlideForRow(currentContentItem.id, block.content);
          orderedSlideIds.push(createdSlideId);
        }
      }

      for (const [index, slideId] of orderedSlideIds.entries()) {
        await mutate(() => window.castApi.setSlideOrder({ slideId, newOrder: index }));
      }

      setStatusText('Saved lyrics');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save lyrics.';
      setStatusText(message);
    } finally {
      setIsSaving(false);
    }
  }, [createSlideForRow, currentContentItem, mutate, onClose, saveRowText, setStatusText, slideElementsBySlideId, slideIds, slides]);

  return { initialBlocks, saveBlocks, isSaving };
}
