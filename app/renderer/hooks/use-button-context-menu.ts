import { useState } from 'react';

interface ButtonMenuState {
  x: number;
  y: number;
}

export function useButtonContextMenu() {
  const [menuState, setMenuState] = useState<ButtonMenuState | null>(null);

  function openMenuFromButton(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    setMenuState({ x: rect.right + 6, y: rect.top });
  }

  function closeMenu() {
    setMenuState(null);
  }

  return {
    menuState,
    openMenuFromButton,
    closeMenu,
  };
}
