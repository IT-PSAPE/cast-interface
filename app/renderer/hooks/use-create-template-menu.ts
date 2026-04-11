import { useMemo } from 'react';
import type { TemplateKind } from '@core/types';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { buildCreateTemplateMenuItems } from '../utils/build-create-template-menu-items';
import { useContextMenuState } from './use-context-menu-state';

interface UseCreateTemplateMenuOptions {
  createTemplate: (kind: TemplateKind) => void | Promise<void>;
}

export function useCreateTemplateMenu({ createTemplate }: UseCreateTemplateMenuOptions) {
  const { menuState, openFromButton, close } = useContextMenuState();
  const menuItems = useMemo<ContextMenuItem[]>(() => buildCreateTemplateMenuItems({ createTemplate }), [createTemplate]);

  function openMenuFromButton(button: HTMLElement) {
    openFromButton(button, undefined as void);
  }

  return {
    menuItems,
    menuState,
    openMenuFromButton,
    closeMenu: close,
  };
}
