import { useMemo } from 'react';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { buildCreateContentMenuItems } from '../utils/build-create-presentation-menu-items';
import { useContextMenuState } from './use-context-menu-state';

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
  const { menuState, openFromButton, close } = useContextMenuState();

  const menuItems = useMemo<ContextMenuItem[]>(() => buildCreateContentMenuItems({
    createDeck,
    createLyric,
    deckLabel,
    lyricLabel
  }), [createDeck, createLyric, deckLabel, lyricLabel]);

  function openMenuFromButton(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    openFromButton(button, undefined as void);
  }

  return {
    menuItems,
    menuState,
    openMenuFromButton,
    closeMenu: close,
  };
}
