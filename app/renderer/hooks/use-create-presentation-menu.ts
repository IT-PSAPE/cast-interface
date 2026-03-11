import { useMemo, useState } from 'react';
import type { ContextMenuItem } from '../components/context-menu';
import { buildCreatePresentationMenuItems } from '../utils/build-create-presentation-menu-items';

interface UseCreatePresentationMenuOptions {
  createPresentation: () => void | Promise<void>;
  createLyric: () => void | Promise<void>;
  presentationLabel?: string;
  lyricLabel?: string;
}

interface CreatePresentationMenuState {
  x: number;
  y: number;
}

export function useCreatePresentationMenu({
  createPresentation,
  createLyric,
  presentationLabel,
  lyricLabel
}: UseCreatePresentationMenuOptions) {
  const [menuState, setMenuState] = useState<CreatePresentationMenuState | null>(null);

  const menuItems = useMemo<ContextMenuItem[]>(() => buildCreatePresentationMenuItems({
    createPresentation,
    createLyric,
    presentationLabel,
    lyricLabel
  }), [createLyric, createPresentation, lyricLabel, presentationLabel]);

  function openMenuFromButton(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    setMenuState({ x: rect.right + 6, y: rect.top });
  }

  function closeMenu() {
    setMenuState(null);
  }

  return {
    menuItems,
    menuState,
    openMenuFromButton,
    closeMenu
  };
}
