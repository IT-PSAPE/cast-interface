import { createElement } from 'react';
import type { ContextMenuItem } from '../components/overlays/context-menu';
import { ContentItemIcon } from '../components/display/entity-icon';

interface BuildCreatePresentationMenuItemsOptions {
  createDeck: () => void | Promise<void>;
  createEmptyLyric: () => void | Promise<void>;
  createLyricFromText?: () => void | Promise<void>;
  deckLabel?: string;
  lyricLabel?: string;
}

export function buildCreateContentMenuItems({
  createDeck,
  createEmptyLyric,
  createLyricFromText,
  deckLabel = 'Deck',
  lyricLabel = 'Lyric'
}: BuildCreatePresentationMenuItemsOptions): ContextMenuItem[] {
  const lyricItem: ContextMenuItem = {
    id: 'create-lyric',
    label: lyricLabel,
    icon: createElement(ContentItemIcon, { entity: 'lyric', size: 14, strokeWidth: 1.75 }),
    onSelect: () => { void createEmptyLyric(); }
  };

  if (createLyricFromText) {
    lyricItem.children = [
      {
        id: 'create-lyric-empty',
        label: 'Empty',
        onSelect: () => { void createEmptyLyric(); }
      },
      {
        id: 'create-lyric-text',
        label: 'Text',
        onSelect: () => { void createLyricFromText(); }
      }
    ];
  }

  return [
    {
      id: 'create-deck',
      label: deckLabel,
      icon: createElement(ContentItemIcon, { entity: 'deck', size: 14, strokeWidth: 1.75 }),
      onSelect: () => { void createDeck(); }
    },
    lyricItem
  ];
}
