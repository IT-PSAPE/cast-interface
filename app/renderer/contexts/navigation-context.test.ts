import type { PlaylistTree, Presentation } from '@core/types';
import { describe, expect, it } from 'vitest';
import {
  resolveCurrentPlaylistPresentationId,
  resolveCurrentPresentationId,
  resolvePinnedLyricPresentationId,
} from './navigation-context';

describe('resolveCurrentPresentationId', () => {
  it('keeps null when nothing is selected', () => {
    expect(resolveCurrentPresentationId(null, ['p-1', 'p-2'])).toBeNull();
  });

  it('keeps selection when selected id still exists', () => {
    expect(resolveCurrentPresentationId('p-2', ['p-1', 'p-2'])).toBe('p-2');
  });

  it('clears selection when selected id no longer exists', () => {
    expect(resolveCurrentPresentationId('p-3', ['p-1', 'p-2'])).toBeNull();
  });
});

describe('resolveCurrentPlaylistPresentationId', () => {
  const selectedTree: PlaylistTree = {
    playlist: { id: 'playlist-1', libraryId: 'library-1', name: 'Playlist', createdAt: '', updatedAt: '' },
    segments: [
      {
        segment: { id: 'segment-1', playlistId: 'playlist-1', name: 'Segment', order: 0, colorKey: null, createdAt: '', updatedAt: '' },
        entries: [
          {
            entry: { id: 'entry-1', segmentId: 'segment-1', presentationId: 'p-1', order: 0, createdAt: '', updatedAt: '' },
            presentation: { id: 'p-1', title: 'Presentation 1', entityType: 'presentation', kind: 'canvas', createdAt: '', updatedAt: '' },
          },
          {
            entry: { id: 'entry-2', segmentId: 'segment-1', presentationId: 'p-2', order: 1, createdAt: '', updatedAt: '' },
            presentation: { id: 'p-2', title: 'Presentation 2', entityType: 'presentation', kind: 'canvas', createdAt: '', updatedAt: '' },
          },
        ],
      },
    ],
  };

  it('keeps the playlist selection when the selected presentation is still in the playlist', () => {
    expect(resolveCurrentPlaylistPresentationId('p-2', selectedTree)).toBe('p-2');
  });

  it('falls back to the first playlist presentation when the current one is missing', () => {
    expect(resolveCurrentPlaylistPresentationId('p-9', selectedTree)).toBe('p-1');
  });

  it('returns null when the playlist has no presentations', () => {
    expect(resolveCurrentPlaylistPresentationId('p-1', { ...selectedTree, segments: [] })).toBeNull();
  });
});

describe('resolvePinnedLyricPresentationId', () => {
  const selectedTree: PlaylistTree = {
    playlist: { id: 'playlist-1', libraryId: 'library-1', name: 'Playlist', createdAt: '', updatedAt: '' },
    segments: [
      {
        segment: { id: 'segment-1', playlistId: 'playlist-1', name: 'Segment', order: 0, colorKey: null, createdAt: '', updatedAt: '' },
        entries: [
          {
            entry: { id: 'entry-1', segmentId: 'segment-1', presentationId: 'p-1', order: 0, createdAt: '', updatedAt: '' },
            presentation: { id: 'p-1', title: 'Presentation 1', entityType: 'presentation', kind: 'canvas', createdAt: '', updatedAt: '' },
          },
        ],
      },
    ],
  };

  const presentationsById = new Map<string, Presentation>([
    ['p-1', { id: 'p-1', title: 'Presentation 1', entityType: 'presentation', kind: 'canvas', createdAt: '', updatedAt: '' }],
    ['p-2', { id: 'p-2', title: 'Lyric 1', entityType: 'lyric', kind: 'lyrics', createdAt: '', updatedAt: '' }],
  ]);

  it('keeps a selected lyric even when it is outside the visible playlist', () => {
    expect(resolvePinnedLyricPresentationId('p-2', selectedTree, presentationsById)).toBe('p-2');
  });

  it('still falls back to the visible playlist for non-lyric presentations', () => {
    expect(resolvePinnedLyricPresentationId('p-9', selectedTree, presentationsById)).toBe('p-1');
  });

  it('clears a selected lyric when it no longer exists', () => {
    expect(resolvePinnedLyricPresentationId('p-2', selectedTree, new Map<string, Presentation>([
      ['p-1', { id: 'p-1', title: 'Presentation 1', entityType: 'presentation', kind: 'canvas', createdAt: '', updatedAt: '' }],
    ]))).toBe('p-1');
  });
});
