import { useMemo } from 'react';
import type { TemplateKind } from '@core/types';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { buildCreateTemplateMenuItems } from '../utils/build-create-template-menu-items';
import { useButtonContextMenu } from './use-button-context-menu';

interface UseCreateTemplateMenuOptions {
  createTemplate: (kind: TemplateKind) => void | Promise<void>;
}

export function useCreateTemplateMenu({ createTemplate }: UseCreateTemplateMenuOptions) {
  const { menuState, openMenuFromButton, closeMenu } = useButtonContextMenu();
  const menuItems = useMemo<ContextMenuItem[]>(() => buildCreateTemplateMenuItems({ createTemplate }), [createTemplate]);

  return {
    menuItems,
    menuState,
    openMenuFromButton,
    closeMenu,
  };
}
