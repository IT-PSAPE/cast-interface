import type { ContextMenuItem } from '../components/context-menu';
import type { TemplateKind } from '@core/types';

interface BuildCreateTemplateMenuItemsOptions {
  createTemplate: (kind: TemplateKind) => void | Promise<void>;
}

export function buildCreateTemplateMenuItems({ createTemplate }: BuildCreateTemplateMenuItemsOptions): ContextMenuItem[] {
  return [
    { id: 'create-slide-template', label: 'Slide Template', onSelect: () => { void createTemplate('slides'); } },
    { id: 'create-lyric-template', label: 'Lyric Template', onSelect: () => { void createTemplate('lyrics'); } },
    { id: 'create-overlay-template', label: 'Overlay Template', onSelect: () => { void createTemplate('overlays'); } },
  ];
}
