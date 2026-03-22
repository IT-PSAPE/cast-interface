import type { ContentItem, PlaylistTree } from '@core/types';
import { describe, expect, it } from 'vitest';
import {
  resolveCurrentPlaylistContentItemId,
  resolveCurrentContentItemId,
  resolvePinnedLyricContentItemId,
} from './navigation-context';

describe('resolveCurrentContentItemId', () => {
  it('keeps null when nothing is selected', () => {
    expect(resolveCurrentContentItemId(null, ['p-1', 'p-2'])).toBeNull();
  });

  it('keeps selection when selected id still exists', () => {
    expect(resolveCurrentContentItemId('p-2', ['p-1', 'p-2'])).toBe('p-2');
  });

  it('clears selection when selected id no longer exists', () => {
    expect(resolveCurrentContentItemId('p-3', ['p-1', 'p-2'])).toBeNull();
  });
});

describe('resolveCurrentPlaylistContentItemId', () => {
  const selectedTree: PlaylistTree = {
    playlist: { id: 'playlist-1', libraryId: 'library-1', name: 'Playlist', createdAt: '', updatedAt: '' },
    segments: [
      {
        segment: { id: 'segment-1', playlistId: 'playlist-1', name: 'Segment', order: 0, colorKey: null, createdAt: '', updatedAt: '' },
        entries: [
          {
            entry: { id: 'entry-1', segmentId: 'segment-1', deckId: 'p-1', lyricId: null, order: 0, createdAt: '', updatedAt: '' },
            item: { id: 'p-1', title: 'Presentation 1', type: 'deck', order: 0, createdAt: '', updatedAt: '' },
          },
          {
            entry: { id: 'entry-2', segmentId: 'segment-1', deckId: 'p-2', lyricId: null, order: 1, createdAt: '', updatedAt: '' },
            item: { id: 'p-2', title: 'Presentation 2', type: 'deck', order: 1, createdAt: '', updatedAt: '' },
          },
        ],
      },
    ],
  };

  it('keeps the playlist selection when the selected presentation is still in the playlist', () => {
    expect(resolveCurrentPlaylistContentItemId('p-2', selectedTree)).toBe('p-2');
  });

  it('clears the selection when the current playlist presentation is missing', () => {
    expect(resolveCurrentPlaylistContentItemId('p-9', selectedTree)).toBeNull();
  });

  it('returns null when the playlist has no presentations', () => {
    expect(resolveCurrentPlaylistContentItemId('p-1', { ...selectedTree, segments: [] })).toBeNull();
  });
});

describe('resolvePinnedLyricContentItemId', () => {
  const selectedTree: PlaylistTree = {
    playlist: { id: 'playlist-1', libraryId: 'library-1', name: 'Playlist', createdAt: '', updatedAt: '' },
    segments: [
      {
        segment: { id: 'segment-1', playlistId: 'playlist-1', name: 'Segment', order: 0, colorKey: null, createdAt: '', updatedAt: '' },
        entries: [
          {
            entry: { id: 'entry-1', segmentId: 'segment-1', deckId: 'p-1', lyricId: null, order: 0, createdAt: '', updatedAt: '' },
            item: { id: 'p-1', title: 'Presentation 1', type: 'deck', order: 0, createdAt: '', updatedAt: '' },
          },
        ],
      },
    ],
  };

  const presentationsById = new Map<string, ContentItem>([
    ['p-1', { id: 'p-1', title: 'Presentation 1', type: 'deck', order: 0, createdAt: '', updatedAt: '' }],
    ['p-2', { id: 'p-2', title: 'Lyric 1', type: 'lyric', order: 1, createdAt: '', updatedAt: '' }],
  ]);

  it('keeps a selected lyric even when it is outside the visible playlist', () => {
    expect(resolvePinnedLyricContentItemId('p-2', selectedTree, presentationsById)).toBe('p-2');
  });

  it('clears the selection for non-lyric presentations that are no longer visible', () => {
    expect(resolvePinnedLyricContentItemId('p-9', selectedTree, presentationsById)).toBeNull();
  });

  it('clears a selected lyric when it no longer exists', () => {
    expect(resolvePinnedLyricContentItemId('p-2', selectedTree, new Map<string, ContentItem>([
      ['p-1', { id: 'p-1', title: 'Presentation 1', type: 'deck', order: 0, createdAt: '', updatedAt: '' }],
    ]))).toBeNull();
  });
});
