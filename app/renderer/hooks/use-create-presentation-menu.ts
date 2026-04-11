import { buildCreateContentMenuItems } from '../utils/build-create-presentation-menu-items';
import { useCreateMenu } from './use-create-menu';

interface UseCreatePresentationMenuOptions {
  createDeck: () => void | Promise<void>;
  createLyric: () => void | Promise<void>;
  deckLabel?: string;
  lyricLabel?: string;
}

export function useCreateContentMenu({ createDeck, createLyric, deckLabel, lyricLabel }: UseCreatePresentationMenuOptions) {
  return useCreateMenu(
    () => buildCreateContentMenuItems({ createDeck, createLyric, deckLabel, lyricLabel }),
    [createDeck, createLyric, deckLabel, lyricLabel],
  );
}
