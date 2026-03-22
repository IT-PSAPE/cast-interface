import type { ContentItem, ContentItemType, Deck, Lyric, PlaylistEntry, Slide } from './types';

interface ContentItemInput {
  id: string;
  title: string;
  type: ContentItemType;
  templateId?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function buildContentItem({ id, title, type, templateId = null, order, createdAt, updatedAt }: ContentItemInput): ContentItem {
  if (type === 'lyric') {
    return {
      id,
      title,
      type,
      templateId,
      order,
      createdAt,
      updatedAt,
    };
  }

  return {
    id,
    title,
    type,
    templateId,
    order,
    createdAt,
    updatedAt,
  };
}

export function isLyricContentItem(item: ContentItem | null | undefined): item is Lyric {
  return item?.type === 'lyric';
}

export function isDeckContentItem(item: ContentItem | null | undefined): item is Deck {
  return item?.type === 'deck';
}

export function getContentItemLabel(item: Pick<ContentItem, 'type'> | ContentItemType): 'Deck' | 'Lyric' {
  const type = typeof item === 'string' ? item : item.type;
  return type === 'lyric' ? 'Lyric' : 'Deck';
}

export function getSlideContentItemId(slide: Pick<Slide, 'deckId' | 'lyricId'>): string | null {
  return slide.deckId ?? slide.lyricId ?? null;
}

export function getSlideContentItemType(slide: Pick<Slide, 'deckId' | 'lyricId'>): ContentItemType | null {
  if (slide.deckId) return 'deck';
  if (slide.lyricId) return 'lyric';
  return null;
}

export function getPlaylistEntryContentItemId(entry: Pick<PlaylistEntry, 'deckId' | 'lyricId'>): string | null {
  return entry.deckId ?? entry.lyricId ?? null;
}

export function getPlaylistEntryContentItemType(entry: Pick<PlaylistEntry, 'deckId' | 'lyricId'>): ContentItemType | null {
  if (entry.deckId) return 'deck';
  if (entry.lyricId) return 'lyric';
  return null;
}
