import { buildCreateContentMenuItems } from '../utils/build-create-presentation-menu-items';
import { useCreateMenu } from './use-create-menu';

interface UseCreatePresentationMenuOptions {
  createDeck: () => void | Promise<void>;
  createEmptyLyric: () => void | Promise<void>;
  createLyricFromText?: () => void | Promise<void>;
  deckLabel?: string;
  lyricLabel?: string;
}

export function useCreateContentMenu({ createDeck, createEmptyLyric, createLyricFromText, deckLabel, lyricLabel }: UseCreatePresentationMenuOptions) {
  return useCreateMenu(
    () => buildCreateContentMenuItems({ createDeck, createEmptyLyric, createLyricFromText, deckLabel, lyricLabel }),
    [createDeck, createEmptyLyric, createLyricFromText, deckLabel, lyricLabel],
  );
}
