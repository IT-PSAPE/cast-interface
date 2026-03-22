import { describe, expect, it } from 'vitest';
import type { ContentItem, PlaylistTree, Slide } from '@core/types';
import { flattenPlaylistPresentationSequence } from './use-playlist-presentation-sequence';

function presentation(id: string, title: string): ContentItem {
  return {
    id,
    title,
    type: 'deck',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function slide(id: string, itemId: string, order: number): Slide {
  return {
    id,
    deckId: itemId,
    lyricId: null,
    width: 1920,
    height: 1080,
    notes: '',
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('flattenPlaylistPresentationSequence', () => {
  it('returns empty when no playlist is selected', () => {
    const items = flattenPlaylistPresentationSequence(null, new Map());
    expect(items).toEqual([]);
  });

  it('flattens playlist entries in segment and entry order while preserving duplicates', () => {
    const p1 = presentation('p-1', 'Welcome');
    const p2 = presentation('p-2', 'Message');

    const tree: PlaylistTree = {
      playlist: {
        id: 'playlist-1',
        libraryId: 'library-1',
        name: 'Sunday',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      segments: [
        {
          segment: {
            id: 'segment-1',
            playlistId: 'playlist-1',
            name: 'Opening',
            colorKey: null,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          entries: [
            {
              entry: {
                id: 'entry-1',
                segmentId: 'segment-1',
                deckId: 'p-1',
                lyricId: null,
                order: 0,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              item: p1,
            },
          ],
        },
        {
          segment: {
            id: 'segment-2',
            playlistId: 'playlist-1',
            name: 'Main',
            colorKey: null,
            order: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          entries: [
            {
              entry: {
                id: 'entry-2',
                segmentId: 'segment-2',
                deckId: 'p-2',
                lyricId: null,
                order: 0,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              item: p2,
            },
            {
              entry: {
                id: 'entry-3',
                segmentId: 'segment-2',
                deckId: 'p-1',
                lyricId: null,
                order: 1,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              item: p1,
            },
          ],
        },
      ],
    };

    const slidesByPresentationId = new Map<string, Slide[]>([
      ['p-1', [slide('s-1', 'p-1', 0), slide('s-2', 'p-1', 1)]],
      ['p-2', [slide('s-3', 'p-2', 0)]],
    ]);

    const items = flattenPlaylistPresentationSequence(tree, slidesByPresentationId);

    expect(items.map((item) => item.entryId)).toEqual(['entry-1', 'entry-2', 'entry-3']);
    expect(items.map((item) => item.item.id)).toEqual(['p-1', 'p-2', 'p-1']);
    expect(items.map((item) => item.occurrenceIndex)).toEqual([1, 1, 2]);
    expect(items[0]?.slides.map((currentSlide) => currentSlide.id)).toEqual(['s-1', 's-2']);
    expect(items[2]?.slides.map((currentSlide) => currentSlide.id)).toEqual(['s-1', 's-2']);
  });
});
