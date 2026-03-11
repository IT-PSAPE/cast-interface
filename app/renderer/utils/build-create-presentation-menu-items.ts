import { createElement } from 'react';
import type { ContextMenuItem } from '../components/context-menu';
import { PresentationEntityIcon } from '../components/presentation-entity-icon';

interface BuildCreatePresentationMenuItemsOptions {
  createPresentation: () => void | Promise<void>;
  createLyric: () => void | Promise<void>;
  presentationLabel?: string;
  lyricLabel?: string;
}

export function buildCreatePresentationMenuItems({
  createPresentation,
  createLyric,
  presentationLabel = 'Presentation',
  lyricLabel = 'Lyric'
}: BuildCreatePresentationMenuItemsOptions): ContextMenuItem[] {
  return [
    {
      id: 'create-presentation',
      label: presentationLabel,
      icon: createElement(PresentationEntityIcon, { entity: 'presentation', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createPresentation(); }
    },
    {
      id: 'create-lyric',
      label: lyricLabel,
      icon: createElement(PresentationEntityIcon, { entity: 'lyric', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createLyric(); }
    }
  ];
}
