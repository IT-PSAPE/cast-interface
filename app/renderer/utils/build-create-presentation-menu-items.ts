import { createElement } from 'react';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { DeckItemIcon } from '../components/display/entity-icon';

interface BuildCreatePresentationMenuItemsOptions {
  createPresentation: () => void | Promise<void>;
  createEmptyLyric: () => void | Promise<void>;
  deckLabel?: string;
  lyricLabel?: string;
}

export function buildCreateContentMenuItems({
  createPresentation,
  createEmptyLyric,
  deckLabel = 'Presentation',
  lyricLabel = 'Lyric'
}: BuildCreatePresentationMenuItemsOptions): ContextMenuItem[] {
  return [
    {
      id: 'create-deck',
      label: deckLabel,
      icon: createElement(DeckItemIcon, { entity: 'presentation', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createPresentation(); }
    },
    {
      id: 'create-lyric',
      label: lyricLabel,
      icon: createElement(DeckItemIcon, { entity: 'lyric', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createEmptyLyric(); }
    }
  ];
}
