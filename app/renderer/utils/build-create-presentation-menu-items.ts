import { createElement } from 'react';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { ContentItemIcon } from '../components/display/entity-icon';

interface BuildCreatePresentationMenuItemsOptions {
  createDeck: () => void | Promise<void>;
  createLyric: () => void | Promise<void>;
  deckLabel?: string;
  lyricLabel?: string;
}

export function buildCreateContentMenuItems({
  createDeck,
  createLyric,
  deckLabel = 'Deck',
  lyricLabel = 'Lyric'
}: BuildCreatePresentationMenuItemsOptions): ContextMenuItem[] {
  return [
    {
      id: 'create-deck',
      label: deckLabel,
      icon: createElement(ContentItemIcon, { entity: 'deck', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createDeck(); }
    },
    {
      id: 'create-lyric',
      label: lyricLabel,
      icon: createElement(ContentItemIcon, { entity: 'lyric', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createLyric(); }
    }
  ];
}
