import { useMemo } from 'react';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { buildCreateContentMenuItems } from '../utils/build-create-presentation-menu-items';
import { useButtonContextMenu } from './use-button-context-menu';

interface UseCreatePresentationMenuOptions {
  createDeck: () => void | Promise<void>;
  createLyric: () => void | Promise<void>;
  deckLabel?: string;
  lyricLabel?: string;
}

export function useCreateContentMenu({
  createDeck,
  createLyric,
  deckLabel,
  lyricLabel
}: UseCreatePresentationMenuOptions) {
  const { menuState, openMenuFromButton, closeMenu } = useButtonContextMenu();

  const menuItems = useMemo<ContextMenuItem[]>(() => buildCreateContentMenuItems({
    createDeck,
    createLyric,
    deckLabel,
    lyricLabel
  }), [createDeck, createLyric, deckLabel, lyricLabel]);

  return {
    menuItems,
    menuState,
    openMenuFromButton,
    closeMenu
  };
}
