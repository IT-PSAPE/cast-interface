import type { PlaylistTree } from '@core/types';
import { describe, expect, it } from 'vitest';
import { resolveCurrentPlaylistPresentationId, resolveCurrentPresentationId } from './navigation-context';

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
            presentation: { id: 'p-1', title: 'Presentation 1', kind: 'canvas', createdAt: '', updatedAt: '' },
          },
          {
            entry: { id: 'entry-2', segmentId: 'segment-1', presentationId: 'p-2', order: 1, createdAt: '', updatedAt: '' },
            presentation: { id: 'p-2', title: 'Presentation 2', kind: 'canvas', createdAt: '', updatedAt: '' },
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
