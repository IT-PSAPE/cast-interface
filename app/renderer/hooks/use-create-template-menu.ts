import type { TemplateKind } from '@core/types';
import { buildCreateTemplateMenuItems } from '../utils/build-create-template-menu-items';
import { useCreateMenu } from './use-create-menu';

interface UseCreateTemplateMenuOptions {
  createTemplate: (kind: TemplateKind) => void | Promise<void>;
}

export function useCreateTemplateMenu({ createTemplate }: UseCreateTemplateMenuOptions) {
  return useCreateMenu(
    () => buildCreateTemplateMenuItems({ createTemplate }),
    [createTemplate],
  );
}
