import { useCallback } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useCast } from '../../../contexts/cast-context';

interface UpdateSlideOutlineTextInput {
  elements: SlideElement[];
  nextText: string;
  slideIndex: number;
  textEditable: boolean;
  textElementId: Id | null;
}

interface SlideOutlineTextEditingResult {
  updateText: (input: UpdateSlideOutlineTextInput) => void;
}

export function useSlideOutlineTextEditing(): SlideOutlineTextEditingResult {
  const { mutate, setStatusText } = useCast();

  const updateText = useCallback((input: UpdateSlideOutlineTextInput) => {
    if (!input.textEditable || !input.textElementId) return;

    const textElement = input.elements.find((element) => element.id === input.textElementId);
    if (!textElement || !('text' in textElement.payload)) return;

    const currentText = String(textElement.payload.text ?? '');
    if (input.nextText === currentText) return;

    void mutate(() => window.castApi.updateElement({
      id: textElement.id,
      payload: {
        ...textElement.payload,
        text: input.nextText,
      },
    }));

    setStatusText(`Updated slide ${input.slideIndex + 1} text`);
  }, [mutate, setStatusText]);

  return { updateText };
}
