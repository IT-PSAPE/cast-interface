import { useMemo, type DependencyList } from 'react';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { useContextMenuState } from './use-context-menu-state';

export function useCreateMenu(buildItems: () => ContextMenuItem[], deps: DependencyList) {
  const { menuState, openFromButton, close } = useContextMenuState();
  const menuItems = useMemo(buildItems, deps);

  function openMenuFromButton(button: HTMLElement) {
    openFromButton(button, undefined as void);
  }

  return { menuItems, menuState, openMenuFromButton, closeMenu: close };
}
