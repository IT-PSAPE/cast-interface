import { useMemo } from 'react';
import type { ContextMenuItem } from '../components/context-menu';
import { buildCreatePresentationMenuItems } from '../utils/build-create-presentation-menu-items';
import { useButtonContextMenu } from './use-button-context-menu';

interface UseCreatePresentationMenuOptions {
  createPresentation: () => void | Promise<void>;
  createLyric: () => void | Promise<void>;
  presentationLabel?: string;
  lyricLabel?: string;
}

export function useCreatePresentationMenu({
  createPresentation,
  createLyric,
  presentationLabel,
  lyricLabel
}: UseCreatePresentationMenuOptions) {
  const { menuState, openMenuFromButton, closeMenu } = useButtonContextMenu();

  const menuItems = useMemo<ContextMenuItem[]>(() => buildCreatePresentationMenuItems({
    createPresentation,
    createLyric,
    presentationLabel,
    lyricLabel
  }), [createLyric, createPresentation, lyricLabel, presentationLabel]);

  return {
    menuItems,
    menuState,
    openMenuFromButton,
    closeMenu
  };
}
