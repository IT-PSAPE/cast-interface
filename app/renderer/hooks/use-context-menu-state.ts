import { useCallback, useState } from 'react';

interface MenuState<T> {
  x: number;
  y: number;
  data: T;
}

interface ContextMenuStateResult<T> {
  menuState: MenuState<T> | null;
  openFromEvent: (event: React.MouseEvent, data: T) => void;
  openFromButton: (button: HTMLElement, data: T) => void;
  close: () => void;
}

export function useContextMenuState<T = void>(): ContextMenuStateResult<T> {
  const [menuState, setMenuState] = useState<MenuState<T> | null>(null);

  const openFromEvent = useCallback((event: React.MouseEvent, data: T) => {
    event.preventDefault();
    setMenuState({ x: event.clientX, y: event.clientY, data });
  }, []);

  const openFromButton = useCallback((button: HTMLElement, data: T) => {
    const rect = button.getBoundingClientRect();
    setMenuState({ x: rect.left, y: rect.bottom + 4, data });
  }, []);

  const close = useCallback(() => {
    setMenuState(null);
  }, []);

  return { menuState, openFromEvent, openFromButton, close };
}
