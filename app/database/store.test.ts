import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSnapshot, DeckBundleManifest, MediaAsset, PlaylistTree, SlideElement } from '@core/types';

let currentUserDataPath = '';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => currentUserDataPath),
  },
}));

function buildEmptySnapshot(): AppSnapshot {
  return {
    libraries: [],
    libraryBundles: [],
    presentations: [],
    lyrics: [],
    slides: [],
    slideElements: [],
    mediaAssets: [],
    overlays: [],
    templates: [],
    stages: [],
    collections: [],
  };
}

function buildImageElement(src: string): SlideElement {
  return {
    id: 'element-image',
    slideId: 'slide-1',
    type: 'image',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    layer: 'content',
    payload: { src },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function buildTextElement(): SlideElement {
  return {
    id: 'element-text',
    slideId: 'overlay-1',
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    layer: 'content',
    payload: {
      text: 'Overlay',
      fontFamily: 'Avenir Next',
      fontSize: 48,
      color: '#FFFFFF',
      alignment: 'left',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('CastRepository', () => {
  let tempRoot: string;
  let repo: any = null;

  beforeEach(() => {
    vi.resetModules();
    tempRoot = fs.mkdtempSync(path.join(process.cwd(), '.tmp-lumacast-store-test-'));
    currentUserDataPath = tempRoot;
  });

  afterEach(() => {
    repo?.db?.close?.();
    repo = null;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('preserves fade and pulse overlay animation kinds', async () => {
    const storeModule = await import('./store');
    repo = new storeModule.CastRepository();
    repo.restoreFromSnapshot(buildEmptySnapshot());

    const createPatch = repo.createOverlay({
      name: 'Overlay',
      animation: { kind: 'fade', durationMs: 350, autoClearDurationMs: 1000 },
      elements: [buildTextElement()],
    });
    const overlayId = createPatch.upserts.overlays?.[0]?.id;

    expect(repo.getSnapshot().overlays[0]?.animation.kind).toBe('fade');

    repo.updateOverlay({
      id: overlayId ?? '',
      animation: { kind: 'pulse', durationMs: 600, autoClearDurationMs: null },
    });

    expect(repo.getSnapshot().overlays[0]?.animation).toMatchObject({
      kind: 'pulse',
      durationMs: 600,
      autoClearDurationMs: null,
    });
  });

  it('assigns imported replacement assets the next media order', async () => {
    const storeModule = await import('./store');
    repo = new storeModule.CastRepository();
    repo.restoreFromSnapshot(buildEmptySnapshot());

    const existingPath = path.join(tempRoot, 'existing.png');
    fs.writeFileSync(existingPath, 'existing');
    repo.createMediaAsset({
      name: 'Existing asset',
      type: 'image',
      src: existingPath,
    });

    const replacementPath = path.join(tempRoot, 'replacement.png');
    fs.writeFileSync(replacementPath, 'replacement');
    const missingSource = path.join(tempRoot, 'missing.png');

    const manifest: DeckBundleManifest = {
      format: 'cast-deck-bundle',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      items: [{
        id: 'item-1',
        type: 'presentation',
        title: 'Imported deck',
        templateId: null,
        order: 0,
        slides: [{
          id: 'slide-1',
          width: 1920,
          height: 1080,
          notes: '',
          order: 0,
          elements: [buildImageElement(missingSource)],
        }],
      }],
      templates: [],
      mediaReferences: [],
    };

    const snapshot = repo.finalizeImportBundle(manifest, [{
      source: missingSource,
      action: 'replace',
      replacementPath,
    }]);

    expect(snapshot.mediaAssets.map((asset: MediaAsset) => ({ name: asset.name, order: asset.order }))).toEqual([
      { name: 'Existing asset', order: 0 },
      { name: 'replacement.png', order: 1 },
    ]);
  });

  it('restores playlists using explicit playlist order values', async () => {
    const storeModule = await import('./store');
    repo = new storeModule.CastRepository();

    const library = {
      id: 'library-1',
      name: 'Library',
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const playlistA: PlaylistTree = {
      playlist: {
        id: 'playlist-a',
        libraryId: library.id,
        name: 'Playlist A',
        order: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      segments: [],
    };
    const playlistB: PlaylistTree = {
      playlist: {
        id: 'playlist-b',
        libraryId: library.id,
        name: 'Playlist B',
        order: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      segments: [],
    };

    const restored = repo.restoreFromSnapshot({
      ...buildEmptySnapshot(),
      libraries: [library],
      libraryBundles: [{
        library,
        playlists: [playlistB, playlistA],
      }],
    });

    expect(restored.libraryBundles[0]?.playlists.map((tree: PlaylistTree) => ({
      id: tree.playlist.id,
      order: tree.playlist.order,
    }))).toEqual([
      { id: 'playlist-a', order: 0 },
      { id: 'playlist-b', order: 1 },
    ]);
  });
});
