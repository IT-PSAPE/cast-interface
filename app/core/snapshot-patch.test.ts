import { applyPatch, type SnapshotPatch } from './snapshot-patch';
import type { AppSnapshot, LibraryPlaylistBundle, SlideElement } from './types';
import { describe, expect, it } from 'vitest';

function buildTextElement(id: string, slideId: string): SlideElement {
  return {
    id,
    slideId,
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'content',
    payload: {
      text: 'Sample',
      fontFamily: 'Helvetica',
      fontSize: 24,
      color: '#FFFFFF',
      alignment: 'center',
      weight: '700',
    },
    createdAt: '2026-04-19T00:00:00.000Z',
    updatedAt: '2026-04-19T00:00:00.000Z',
  };
}

function buildLibraryBundles(): LibraryPlaylistBundle[] {
  return [{
    library: {
      id: 'library-1',
      name: 'Library One',
      order: 0,
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    },
    playlists: [],
  }];
}

function buildSnapshot(): AppSnapshot {
  return {
    libraries: [{
      id: 'library-1',
      name: 'Library One',
      order: 0,
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    }],
    libraryBundles: buildLibraryBundles(),
    presentations: [{
      id: 'presentation-1',
      type: 'presentation',
      title: 'Presentation One',
      templateId: null,
      order: 0,
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    }],
    lyrics: [],
    slides: [{
      id: 'slide-1',
      presentationId: 'presentation-1',
      lyricId: null,
      width: 1920,
      height: 1080,
      notes: 'Original notes',
      order: 0,
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    }],
    slideElements: [buildTextElement('element-1', 'slide-1')],
    mediaAssets: [],
    overlays: [],
    templates: [],
  };
}

describe('applyPatch', () => {
  it('merges upserts into top-level tables', () => {
    const snapshot = buildSnapshot();
    const patch: SnapshotPatch = {
      version: 1,
      upserts: {
        libraries: [
          { ...snapshot.libraries[0], name: 'Renamed Library' },
          {
            id: 'library-2',
            name: 'Library Two',
            order: 1,
            createdAt: '2026-04-19T00:00:01.000Z',
            updatedAt: '2026-04-19T00:00:01.000Z',
          },
        ],
      },
      deletes: {},
    };

    const next = applyPatch(snapshot, patch);

    expect(next.libraries).toHaveLength(2);
    expect(next.libraries[0]?.name).toBe('Renamed Library');
    expect(next.libraries[1]?.id).toBe('library-2');
  });

  it('removes deleted records from top-level tables', () => {
    const snapshot = buildSnapshot();
    const patch: SnapshotPatch = {
      version: 2,
      upserts: {},
      deletes: { presentations: ['presentation-1'], slides: ['slide-1'], slideElements: ['element-1'] },
    };

    const next = applyPatch(snapshot, patch);

    expect(next.presentations).toEqual([]);
    expect(next.slides).toEqual([]);
    expect(next.slideElements).toEqual([]);
  });

  it('supports mixed upserts and deletes in the same patch', () => {
    const snapshot = buildSnapshot();
    const patch: SnapshotPatch = {
      version: 3,
      upserts: {
        slides: [{
          ...snapshot.slides[0],
          notes: 'Updated notes',
        }],
        slideElements: [buildTextElement('element-2', 'slide-1')],
      },
      deletes: { slideElements: ['element-1'] },
    };

    const next = applyPatch(snapshot, patch);

    expect(next.slides[0]?.notes).toBe('Updated notes');
    expect(next.slideElements).toHaveLength(1);
    expect(next.slideElements[0]?.id).toBe('element-2');
  });

  it('preserves references for unchanged collections', () => {
    const snapshot = buildSnapshot();
    const patch: SnapshotPatch = {
      version: 4,
      upserts: {
        slides: [{
          ...snapshot.slides[0],
          notes: 'Reference test',
        }],
      },
      deletes: {},
    };

    const next = applyPatch(snapshot, patch);

    expect(next.libraries).toBe(snapshot.libraries);
    expect(next.presentations).toBe(snapshot.presentations);
    expect(next.mediaAssets).toBe(snapshot.mediaAssets);
    expect(next.slides).not.toBe(snapshot.slides);
  });

  it('replaces libraryBundles wholesale when included in the patch', () => {
    const snapshot = buildSnapshot();
    const replacementBundles: LibraryPlaylistBundle[] = [{
      library: {
        ...snapshot.libraries[0],
        name: 'Bundles Rebuilt',
      },
      playlists: [],
    }];
    const patch: SnapshotPatch = {
      version: 5,
      upserts: { libraryBundles: replacementBundles },
      deletes: {},
    };

    const next = applyPatch(snapshot, patch);

    expect(next.libraryBundles).toBe(replacementBundles);
    expect(next.libraryBundles[0]?.library.name).toBe('Bundles Rebuilt');
  });
});
