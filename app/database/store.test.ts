import fs from 'node:fs';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeRepository, createTempUserDataPath, databasePath } from './store-test-support';

const electronState = vi.hoisted(() => ({ userDataPath: '' }));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => electronState.userDataPath),
  },
}));

import { CastRepository } from './store';

interface LegacyFixtureOptions {
  duplicatePresentationAcrossLibraries?: boolean;
}

function createLegacyDatabase(userDataPath: string, options: LegacyFixtureOptions = {}): void {
  const db = new Database(databasePath(userDataPath));

  db.exec(`
    CREATE TABLE libraries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE presentations (
      id TEXT PRIMARY KEY,
      library_id TEXT NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'canvas',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE slides (
      id TEXT PRIMARY KEY,
      presentation_id TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE slide_elements (
      id TEXT PRIMARY KEY,
      slide_id TEXT NOT NULL,
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      rotation REAL NOT NULL,
      opacity REAL NOT NULL,
      z_index INTEGER NOT NULL,
      layer TEXT NOT NULL DEFAULT 'content',
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE playlists (
      id TEXT PRIMARY KEY,
      library_id TEXT NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE playlist_segments (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color_key TEXT,
      order_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE playlist_entries (
      id TEXT PRIMARY KEY,
      segment_id TEXT NOT NULL,
      presentation_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE media_assets (
      id TEXT PRIMARY KEY,
      library_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      src TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE overlays (
      id TEXT PRIMARY KEY,
      library_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      opacity REAL NOT NULL,
      z_index INTEGER NOT NULL,
      enabled INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      elements_json TEXT NOT NULL DEFAULT '[]',
      animation_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const insertLibrary = db.prepare('INSERT INTO libraries (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)');
  const insertPresentation = db.prepare(
    'INSERT INTO presentations (id, library_id, title, kind, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertSlide = db.prepare(
    'INSERT INTO slides (id, presentation_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertSlideElement = db.prepare(
    `INSERT INTO slide_elements
      (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertPlaylist = db.prepare(
    'INSERT INTO playlists (id, library_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertSegment = db.prepare(
    'INSERT INTO playlist_segments (id, playlist_id, name, color_key, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertEntry = db.prepare(
    'INSERT INTO playlist_entries (id, segment_id, presentation_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertMediaAsset = db.prepare(
    'INSERT INTO media_assets (id, library_id, name, type, src, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertOverlay = db.prepare(
    `INSERT INTO overlays
      (id, library_id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    insertLibrary.run('library-1', 'Main Library', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    insertLibrary.run('library-2', 'Youth Library', '2026-01-02T00:00:00.000Z', '2026-01-02T00:00:00.000Z');
    insertPresentation.run('presentation-1', 'library-1', 'Welcome', 'canvas', 0, '2026-01-03T00:00:00.000Z', '2026-01-03T00:00:00.000Z');
    insertPresentation.run('presentation-2', 'library-2', 'Message', 'canvas', 0, '2026-01-04T00:00:00.000Z', '2026-01-04T00:00:00.000Z');
    insertSlide.run('slide-1', 'presentation-1', 1920, 1080, '', 0, '2026-01-03T00:00:00.000Z', '2026-01-03T00:00:00.000Z');
    insertSlide.run('slide-2', 'presentation-2', 1920, 1080, '', 0, '2026-01-04T00:00:00.000Z', '2026-01-04T00:00:00.000Z');
    insertSlideElement.run(
      'element-1',
      'slide-1',
      'text',
      100,
      100,
      500,
      120,
      0,
      1,
      1,
      'content',
      JSON.stringify({ text: 'Welcome', fontFamily: 'Avenir Next', fontSize: 72, color: '#FFFFFF', alignment: 'center', weight: '700' }),
      '2026-01-03T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z',
    );
    insertPlaylist.run('playlist-1', 'library-1', 'Sunday Service', 0, '2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z');
    insertPlaylist.run('playlist-2', 'library-2', 'Youth Service', 0, '2026-01-06T00:00:00.000Z', '2026-01-06T00:00:00.000Z');
    insertSegment.run('segment-1', 'playlist-1', 'Opening', null, 0, '2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z');
    insertSegment.run('segment-2', 'playlist-2', 'Message', null, 0, '2026-01-06T00:00:00.000Z', '2026-01-06T00:00:00.000Z');
    insertEntry.run('entry-1', 'segment-1', 'presentation-1', 0, '2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z');
    insertEntry.run(
      'entry-2',
      'segment-2',
      options.duplicatePresentationAcrossLibraries ? 'presentation-1' : 'presentation-2',
      0,
      '2026-01-06T00:00:00.000Z',
      '2026-01-06T00:00:00.000Z',
    );
    insertMediaAsset.run('media-1', 'library-1', 'Background', 'image', 'cast-media://background-1', '2026-01-03T00:00:00.000Z', '2026-01-03T00:00:00.000Z');
    insertMediaAsset.run('media-2', 'library-2', 'Youth Background', 'image', 'cast-media://background-2', '2026-01-04T00:00:00.000Z', '2026-01-04T00:00:00.000Z');
    insertOverlay.run(
      'overlay-1',
      'library-1',
      'Global Overlay One',
      'text',
      0,
      0,
      1920,
      1080,
      1,
      0,
      1,
      JSON.stringify({ text: 'Overlay One', fontFamily: 'Avenir Next', fontSize: 72, color: '#FFFFFF', alignment: 'center', weight: '700' }),
      JSON.stringify([]),
      JSON.stringify({ kind: 'fade', durationMs: 2500 }),
      '2026-01-03T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z',
    );
    insertOverlay.run(
      'overlay-2',
      'library-2',
      'Global Overlay Two',
      'text',
      0,
      0,
      1920,
      1080,
      1,
      0,
      1,
      JSON.stringify({ text: 'Overlay Two', fontFamily: 'Avenir Next', fontSize: 72, color: '#FFFFFF', alignment: 'center', weight: '700' }),
      JSON.stringify([]),
      JSON.stringify({ kind: 'none', durationMs: 0 }),
      '2026-01-04T00:00:00.000Z',
      '2026-01-04T00:00:00.000Z',
    );
  });

  tx();
  db.close();
}

describe('CastRepository global project migration', () => {
  let userDataPath = '';

  afterEach(() => {
    if (userDataPath) {
      fs.rmSync(userDataPath, { recursive: true, force: true });
      userDataPath = '';
    }
  });

  it('migrates scoped content into global project collections and preserves ids', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;
    createLegacyDatabase(userDataPath);

    const repository = new CastRepository();
    const snapshot = repository.getSnapshot();
    closeRepository(repository);

    expect(snapshot.presentations.map((presentation) => presentation.id)).toEqual(['presentation-1', 'presentation-2']);
    expect(snapshot.mediaAssets.map((asset) => asset.id)).toEqual(['media-1', 'media-2']);
    expect(snapshot.overlays.map((overlay) => overlay.id)).toEqual(['overlay-1', 'overlay-2']);
    expect(snapshot.libraryBundles).toHaveLength(2);
    expect(snapshot.libraryBundles[0]?.playlists[0]?.segments[0]?.entries[0]?.presentation.id).toBe('presentation-1');

    const db = new Database(databasePath(userDataPath), { readonly: true });
    const userVersion = db.pragma('user_version', { simple: true }) as number;
    const presentationColumns = db.prepare('PRAGMA table_info(presentations)').all() as Array<{ name: string }>;
    db.close();

    expect(userVersion).toBe(5);
    expect(presentationColumns.some((column) => column.name === 'library_id')).toBe(false);
    expect(presentationColumns.some((column) => column.name === 'template_id')).toBe(true);
  });

  it('keeps global presentations, media, and overlays when a library is deleted', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;
    createLegacyDatabase(userDataPath);

    const repository = new CastRepository();
    const snapshot = repository.deleteLibrary('library-1');
    closeRepository(repository);

    expect(snapshot.libraries.map((library) => library.id)).toEqual(['library-2']);
    expect(snapshot.presentations.map((presentation) => presentation.id)).toEqual(['presentation-1', 'presentation-2']);
    expect(snapshot.mediaAssets.map((asset) => asset.id)).toEqual(['media-1', 'media-2']);
    expect(snapshot.overlays.map((overlay) => overlay.id)).toEqual(['overlay-1', 'overlay-2']);
    expect(snapshot.libraryBundles.find((bundle) => bundle.library.id === 'library-1')).toBeUndefined();
  });

  it('removes playlist references across libraries when a global presentation is deleted', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;
    createLegacyDatabase(userDataPath, { duplicatePresentationAcrossLibraries: true });

    const repository = new CastRepository();
    const snapshot = repository.deletePresentation('presentation-1');
    closeRepository(repository);

    expect(snapshot.presentations.map((presentation) => presentation.id)).toEqual(['presentation-2']);
    expect(snapshot.slides.map((slide) => slide.id)).toEqual(['slide-2']);
    expect(snapshot.slideElements.map((element) => element.id)).toEqual([]);
    expect(
      snapshot.libraryBundles.flatMap((bundle) =>
        bundle.playlists.flatMap((playlist) =>
          playlist.segments.flatMap((segment) => segment.entries.map((entry) => entry.presentation.id))
        )
      ),
    ).toEqual([]);
  });

  it('does not rerun the migration after user_version is set', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;
    createLegacyDatabase(userDataPath);

    const firstRepository = new CastRepository();
    closeRepository(firstRepository);

    const writableDb = new Database(databasePath(userDataPath));
    writableDb.prepare('UPDATE presentations SET order_index = ? WHERE id = ?').run(77, 'presentation-2');
    writableDb.close();

    const secondRepository = new CastRepository();
    closeRepository(secondRepository);

    const verificationDb = new Database(databasePath(userDataPath), { readonly: true });
    const presentationOrder = verificationDb.prepare('SELECT order_index FROM presentations WHERE id = ?').get('presentation-2') as { order_index: number };
    const userVersion = verificationDb.pragma('user_version', { simple: true }) as number;
    verificationDb.close();

    expect(userVersion).toBe(5);
    expect(presentationOrder.order_index).toBe(77);
  });
});
