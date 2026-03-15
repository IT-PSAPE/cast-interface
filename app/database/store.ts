import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { buildPresentationEntity } from '@core/presentation-entities';
import { applyTemplateToElements, createDefaultTemplateElements, isTemplateCompatibleWithPresentation } from '@core/templates';
import { createId, nowIso } from '@core/utils';
import type {
  AppSnapshot,
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  Library,
  MediaAsset,
  Overlay,
  OverlayCreateInput,
  OverlayUpdateInput,
  Playlist,
  PlaylistEntry,
  PlaylistSegment,
  PlaylistTree,
  Presentation,
  PresentationKind,
  Slide,
  SlideElement,
  SlideElementPayload,
  SlideCreateInput,
  SlideNotesUpdateInput,
  Template,
  TemplateCreateInput,
  TemplateKind,
  TemplateUpdateInput,
} from '@core/types';

const DEFAULT_W = 1920;
const DEFAULT_H = 1080;
const LATEST_SCHEMA_VERSION = 4;
const GLOBAL_SCHEMA_VERSION = 3;
const LEGACY_SCHEMA_VERSION = 2;

const parseJson = <T>(value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[DB] Failed to parse JSON:', error, value.slice(0, 200));
    throw new Error(`Corrupted JSON data in database: ${(error as Error).message}`);
  }
};

function emptyOverlayPayload(): SlideElementPayload {
  return {
    text: '',
    fontFamily: 'Avenir Next',
    fontSize: 48,
    color: '#FFFFFF',
    alignment: 'left',
    weight: '700',
  };
}

function normalizeOverlayAnimation(animation: unknown): Required<Overlay['animation']> {
  const parsed = animation as Partial<Overlay['animation']> | null | undefined;
  const rawKind = parsed?.kind;
  const kind = rawKind === 'dissolve' || rawKind === 'fade' || rawKind === 'pulse'
    ? 'dissolve'
    : 'none';
  const durationMs = Math.max(0, Number.isFinite(parsed?.durationMs) ? parsed?.durationMs ?? 0 : 0);
  const autoClearDurationMs = parsed?.autoClearDurationMs == null
    ? null
    : Math.max(0, Number.isFinite(parsed.autoClearDurationMs) ? parsed.autoClearDurationMs : 0);

  return {
    kind,
    durationMs,
    autoClearDurationMs,
  };
}

function summarizeOverlayElements(elements: SlideElement[]): Pick<Overlay, 'type' | 'x' | 'y' | 'width' | 'height' | 'opacity' | 'zIndex' | 'payload'> {
  const primary = elements
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .at(-1);

  if (!primary) {
    return {
      type: 'text',
      x: 0,
      y: 0,
      width: DEFAULT_W,
      height: DEFAULT_H,
      opacity: 1,
      zIndex: 0,
      payload: emptyOverlayPayload(),
    };
  }

  return {
    type: primary.type === 'shape' ? 'shape' : primary.type === 'text' ? 'text' : primary.type === 'video' ? 'video' : 'image',
    x: primary.x,
    y: primary.y,
    width: primary.width,
    height: primary.height,
    opacity: primary.opacity,
    zIndex: primary.zIndex,
    payload: primary.payload,
  };
}

function legacyOverlayElement(row: {
  id: string;
  type: Overlay['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  z_index: number;
  payload_json: string;
  created_at: string;
  updated_at: string;
}): SlideElement {
  return {
    id: row.id,
    slideId: row.id,
    type: row.type === 'shape' ? 'shape' : row.type === 'text' ? 'text' : row.type === 'video' ? 'video' : 'image',
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: 0,
    opacity: row.opacity,
    zIndex: row.z_index,
    layer: 'content',
    payload: parseJson<SlideElementPayload>(row.payload_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CastRepository {
  private db: Database.Database;

  constructor() {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'cast-interface.sqlite');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeSchema();
    this.seedIfEmpty();
  }

  private initializeSchema(): void {
    const currentVersion = this.getUserVersion();

    if (currentVersion === 0) {
      if (!this.hasTable('libraries')) {
        this.createGlobalSchema();
        this.setUserVersion(LATEST_SCHEMA_VERSION);
        return;
      }

      this.prepareLegacySchema();
      this.setUserVersion(LEGACY_SCHEMA_VERSION);
    }

    if (this.getUserVersion() < GLOBAL_SCHEMA_VERSION) {
      this.migrateLegacyProjectContentToGlobalScope();
    }

    if (this.getUserVersion() < LATEST_SCHEMA_VERSION) {
      this.ensureTemplatesSchema();
      this.setUserVersion(LATEST_SCHEMA_VERSION);
    }
  }

  private getUserVersion(): number {
    return this.db.pragma('user_version', { simple: true }) as number;
  }

  private setUserVersion(version: number): void {
    this.db.pragma(`user_version = ${version}`);
  }

  private hasTable(name: string): boolean {
    const row = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(name) as { name: string } | undefined;

    return row?.name === name;
  }

  private createLegacySchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS presentations (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        title TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'canvas',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      );

      CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        presentation_id TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(presentation_id) REFERENCES presentations(id)
      );

      CREATE TABLE IF NOT EXISTS slide_elements (
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
        updated_at TEXT NOT NULL,
        FOREIGN KEY(slide_id) REFERENCES slides(id)
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      );

      CREATE TABLE IF NOT EXISTS playlist_segments (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color_key TEXT,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(playlist_id) REFERENCES playlists(id)
      );

      CREATE TABLE IF NOT EXISTS playlist_entries (
        id TEXT PRIMARY KEY,
        segment_id TEXT NOT NULL,
        presentation_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(segment_id) REFERENCES playlist_segments(id),
        FOREIGN KEY(presentation_id) REFERENCES presentations(id)
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        src TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      );

      CREATE TABLE IF NOT EXISTS overlays (
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
        updated_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        elements_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_presentations_library_id ON presentations(library_id);
      CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
      CREATE INDEX IF NOT EXISTS idx_slide_elements_slide_id ON slide_elements(slide_id);
      CREATE INDEX IF NOT EXISTS idx_playlists_library_id ON playlists(library_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_segments_playlist_id ON playlist_segments(playlist_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_entries_segment_id ON playlist_entries(segment_id);
      CREATE INDEX IF NOT EXISTS idx_media_assets_library_id ON media_assets(library_id);
      CREATE INDEX IF NOT EXISTS idx_overlays_library_id ON overlays(library_id);
      CREATE INDEX IF NOT EXISTS idx_templates_order_index ON templates(order_index);
    `);
  }

  private createGlobalSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS presentations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'canvas',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        presentation_id TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(presentation_id) REFERENCES presentations(id)
      );

      CREATE TABLE IF NOT EXISTS slide_elements (
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
        updated_at TEXT NOT NULL,
        FOREIGN KEY(slide_id) REFERENCES slides(id)
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      );

      CREATE TABLE IF NOT EXISTS playlist_segments (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color_key TEXT,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(playlist_id) REFERENCES playlists(id)
      );

      CREATE TABLE IF NOT EXISTS playlist_entries (
        id TEXT PRIMARY KEY,
        segment_id TEXT NOT NULL,
        presentation_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(segment_id) REFERENCES playlist_segments(id),
        FOREIGN KEY(presentation_id) REFERENCES presentations(id)
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        src TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS overlays (
        id TEXT PRIMARY KEY,
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

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        elements_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.createCommonIndexes();
    this.createGlobalContentIndexes();
  }

  private createCommonIndexes(): void {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
      CREATE INDEX IF NOT EXISTS idx_slide_elements_slide_id ON slide_elements(slide_id);
      CREATE INDEX IF NOT EXISTS idx_playlists_library_id ON playlists(library_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_segments_playlist_id ON playlist_segments(playlist_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_entries_segment_id ON playlist_entries(segment_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_entries_presentation_id ON playlist_entries(presentation_id);
    `);
  }

  private createGlobalContentIndexes(): void {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_presentations_order_index ON presentations(order_index);
      CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
      CREATE INDEX IF NOT EXISTS idx_overlays_created_at ON overlays(created_at);
      CREATE INDEX IF NOT EXISTS idx_templates_order_index ON templates(order_index);
    `);
  }

  private ensureTemplatesSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        elements_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_templates_order_index ON templates(order_index)');
  }

  private prepareLegacySchema(): void {
    this.createLegacySchema();
    this.ensureOrderingColumns();
    this.ensureSlideNotesColumn();
    this.ensureOverlayCompositionColumns();
    this.migrateMediaSrcProtocol();
  }

  private migrateLegacyProjectContentToGlobalScope(): void {
    const previousForeignKeys = this.db.pragma('foreign_keys', { simple: true }) as number;
    this.db.pragma('foreign_keys = OFF');

    try {
      const tx = this.db.transaction(() => {
        this.db.exec(`
          CREATE TABLE presentations_v3 (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'canvas',
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE media_assets_v3 (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            src TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE overlays_v3 (
            id TEXT PRIMARY KEY,
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

        this.db.exec(`
          INSERT INTO presentations_v3 (id, title, kind, order_index, created_at, updated_at)
          SELECT
            p.id,
            p.title,
            p.kind,
            ROW_NUMBER() OVER (
              ORDER BY
                COALESCE(l.created_at, p.created_at) ASC,
                COALESCE(lp.order_index, 0) ASC,
                p.order_index ASC,
                p.created_at ASC,
                p.id ASC
            ) - 1,
            p.created_at,
            p.updated_at
          FROM presentations p
          LEFT JOIN libraries l ON l.id = p.library_id
          LEFT JOIN (
            SELECT library_id, MIN(order_index) AS order_index
            FROM playlists
            GROUP BY library_id
          ) lp ON lp.library_id = p.library_id;

          INSERT INTO media_assets_v3 (id, name, type, src, created_at, updated_at)
          SELECT id, name, type, src, created_at, updated_at
          FROM media_assets
          ORDER BY created_at ASC, id ASC;

          INSERT INTO overlays_v3 (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, created_at, updated_at)
          SELECT id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, created_at, updated_at
          FROM overlays
          ORDER BY created_at ASC, id ASC;
        `);

        this.db.exec(`
          DROP INDEX IF EXISTS idx_presentations_library_id;
          DROP INDEX IF EXISTS idx_media_assets_library_id;
          DROP INDEX IF EXISTS idx_overlays_library_id;

          DROP TABLE overlays;
          DROP TABLE media_assets;
          DROP TABLE presentations;

          ALTER TABLE presentations_v3 RENAME TO presentations;
          ALTER TABLE media_assets_v3 RENAME TO media_assets;
          ALTER TABLE overlays_v3 RENAME TO overlays;
        `);

        this.createCommonIndexes();
        this.createGlobalContentIndexes();
        this.setUserVersion(GLOBAL_SCHEMA_VERSION);
      });

      tx();
    } finally {
      this.db.pragma(`foreign_keys = ${previousForeignKeys ? 'ON' : 'OFF'}`);
    }
  }

  private seedIfEmpty(): void {
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM libraries').get() as { count: number };
    if (count.count > 0) return;

    const libraryId = createId();
    const presentationId = createId();
    const slideId = createId();
    const playlistId = createId();
    const segmentId = createId();
    const now = nowIso();

    const tx = this.db.transaction(() => {
      this.db
        .prepare('INSERT INTO libraries (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(libraryId, 'Church Library', now, now);

      this.db
        .prepare('INSERT INTO presentations (id, title, kind, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(presentationId, 'Welcome Slides', 'canvas', 0, now, now);

      this.db
        .prepare(
          'INSERT INTO slides (id, presentation_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(slideId, presentationId, DEFAULT_W, DEFAULT_H, '', 0, now, now);

      const titlePayload = JSON.stringify({
        text: 'Welcome to Cast Interface',
        fontFamily: 'Helvetica',
        fontSize: 64,
        color: '#FFFFFF',
        alignment: 'center',
        weight: '700'
      });

      this.db
        .prepare(
          `INSERT INTO slide_elements (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(createId(), slideId, 'text', 200, 430, 1520, 120, 0, 1, 10, 'content', titlePayload, now, now);

      const shapePayload = JSON.stringify({
        fillColor: '#101820CC',
        borderColor: '#FFFFFF33',
        borderWidth: 2,
        borderRadius: 12
      });

      this.db
        .prepare(
          `INSERT INTO slide_elements (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(createId(), slideId, 'shape', 160, 380, 1600, 220, 0, 1, 1, 'background', shapePayload, now, now);

      this.db
        .prepare('INSERT INTO playlists (id, library_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(playlistId, libraryId, 'Sunday Service', 0, now, now);

      this.db
        .prepare(
          'INSERT INTO playlist_segments (id, playlist_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(segmentId, playlistId, 'Opening', 0, now, now);

      this.db
        .prepare(
          'INSERT INTO playlist_entries (id, segment_id, presentation_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(createId(), segmentId, presentationId, 0, now, now);

      this.db
        .prepare(
          `INSERT INTO overlays (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          createId(),
          'Watermark',
          'text',
          1540,
          1010,
          340,
          40,
          0.65,
          999,
          1,
          JSON.stringify({
            text: 'CAST INTERFACE',
            fontFamily: 'Helvetica',
            fontSize: 28,
            color: '#FFFFFF',
            alignment: 'right',
            weight: '600'
          }),
          JSON.stringify([
            {
              id: createId(),
              slideId: '__seed_overlay__',
              type: 'text',
              x: 1540,
              y: 1010,
              width: 340,
              height: 40,
              rotation: 0,
              opacity: 0.65,
              zIndex: 999,
              layer: 'content',
              payload: {
                text: 'CAST INTERFACE',
                fontFamily: 'Helvetica',
                fontSize: 28,
                color: '#FFFFFF',
                alignment: 'right',
                weight: '600'
              },
              createdAt: now,
              updatedAt: now,
            },
          ]),
          JSON.stringify({ kind: 'pulse', durationMs: 2000 }),
          now,
          now
        );
    });

    tx();
  }

  private migrateMediaSrcProtocol(): void {
    const toCastMediaSrc = (src: string): string | null => {
      if (src.startsWith('blob:')) return null;

      if (src.startsWith('file://')) {
        const normalizedPath = filePathFromFileUrl(src);
        if (!normalizedPath) return null;
        return `cast-media://${encodeURIComponent(normalizedPath)}`;
      }

      if (src.startsWith('cast-media://')) {
        const normalizedPath = decodeCastMediaPath(src);
        if (!normalizedPath) return null;
        return `cast-media://${encodeURIComponent(normalizedPath)}`;
      }

      return src;
    };

    const filePathFromFileUrl = (src: string): string | null => {
      try {
        return fileURLToPath(new URL(src));
      } catch {
        const rawPath = src.slice('file://'.length);
        if (!rawPath) return null;
        try {
          return decodeURIComponent(rawPath);
        } catch {
          return rawPath;
        }
      }
    };

    const decodeCastMediaPath = (src: string): string | null => {
      const encodedPath = src.slice('cast-media://'.length);
      if (!encodedPath) return null;

      let decodedOnce: string;
      try {
        decodedOnce = decodeURIComponent(encodedPath);
      } catch {
        return null;
      }

      if (!encodedPath.includes('%25')) return decodedOnce;

      try {
        const decodedTwice = decodeURIComponent(decodedOnce);
        if (decodedTwice === decodedOnce) return decodedOnce;
        if (existsSync(decodedOnce)) return decodedOnce;
        if (existsSync(decodedTwice)) return decodedTwice;
        return decodedTwice;
      } catch {
        return decodedOnce;
      }
    };

    const tx = this.db.transaction(() => {
      const assets = this.db
        .prepare("SELECT id, src FROM media_assets WHERE src LIKE 'cast-media://%' OR src LIKE 'file://%' OR src LIKE 'blob:%'")
        .all() as Array<{ id: string; src: string }>;

      const updateAsset = this.db.prepare('UPDATE media_assets SET src = ? WHERE id = ?');
      const deleteAsset = this.db.prepare('DELETE FROM media_assets WHERE id = ?');
      for (const asset of assets) {
        const newSrc = toCastMediaSrc(asset.src);
        if (!newSrc) {
          deleteAsset.run(asset.id);
          continue;
        }
        if (newSrc !== asset.src) {
          updateAsset.run(newSrc, asset.id);
        }
      }

      const elements = this.db
        .prepare("SELECT id, payload_json FROM slide_elements WHERE type IN ('image', 'video') AND (payload_json LIKE '%cast-media://%' OR payload_json LIKE '%file://%' OR payload_json LIKE '%blob:%')")
        .all() as Array<{ id: string; payload_json: string }>;

      const updateElement = this.db.prepare('UPDATE slide_elements SET payload_json = ? WHERE id = ?');
      const deleteElement = this.db.prepare('DELETE FROM slide_elements WHERE id = ?');
      for (const el of elements) {
        const payload = parseJson<{ src: string }>(el.payload_json);
        const newSrc = toCastMediaSrc(payload.src);
        if (newSrc) {
          if (newSrc === payload.src) continue;
          payload.src = newSrc;
          updateElement.run(JSON.stringify(payload), el.id);
        } else {
          deleteElement.run(el.id);
        }
      }
    });

    tx();
  }

  private ensureOrderingColumns(): void {
    const presentationColumns = this.db.prepare('PRAGMA table_info(presentations)').all() as Array<{ name: string }>;
    if (!presentationColumns.some((column) => column.name === 'order_index')) {
      this.db.prepare('ALTER TABLE presentations ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0').run();
      this.db
        .prepare(
          `WITH ranked AS (
             SELECT id, ROW_NUMBER() OVER (PARTITION BY library_id ORDER BY created_at ASC, id ASC) - 1 AS next_order
             FROM presentations
           )
           UPDATE presentations
           SET order_index = (SELECT next_order FROM ranked WHERE ranked.id = presentations.id)`
        )
        .run();
    }
    if (!presentationColumns.some((column) => column.name === 'kind')) {
      this.db.prepare("ALTER TABLE presentations ADD COLUMN kind TEXT NOT NULL DEFAULT 'canvas'").run();
    }

    const playlistColumns = this.db.prepare('PRAGMA table_info(playlists)').all() as Array<{ name: string }>;
    if (!playlistColumns.some((column) => column.name === 'order_index')) {
      this.db.prepare('ALTER TABLE playlists ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0').run();
      this.db
        .prepare(
          `WITH ranked AS (
             SELECT id, ROW_NUMBER() OVER (PARTITION BY library_id ORDER BY created_at ASC, id ASC) - 1 AS next_order
             FROM playlists
           )
           UPDATE playlists
           SET order_index = (SELECT next_order FROM ranked WHERE ranked.id = playlists.id)`
        )
        .run();
    }

    const segmentColumns = this.db.prepare('PRAGMA table_info(playlist_segments)').all() as Array<{ name: string }>;
    if (!segmentColumns.some((column) => column.name === 'color_key')) {
      this.db.prepare('ALTER TABLE playlist_segments ADD COLUMN color_key TEXT').run();
    }
  }

  private ensureOverlayCompositionColumns(): void {
    const overlayColumns = this.db.prepare('PRAGMA table_info(overlays)').all() as Array<{ name: string }>;
    if (!overlayColumns.some((column) => column.name === 'elements_json')) {
      this.db.prepare("ALTER TABLE overlays ADD COLUMN elements_json TEXT NOT NULL DEFAULT '[]'").run();
    }

    const rows = this.db
      .prepare(
        `SELECT id, type, x, y, width, height, opacity, z_index, payload_json, created_at, updated_at, elements_json
         FROM overlays`
      )
      .all() as Array<{
      id: string;
      type: Overlay['type'];
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
      z_index: number;
      payload_json: string;
      created_at: string;
      updated_at: string;
      elements_json: string | null;
    }>;

    const updateElements = this.db.prepare('UPDATE overlays SET elements_json = ? WHERE id = ?');
    for (const row of rows) {
      if (row.elements_json) continue;
      updateElements.run(JSON.stringify([legacyOverlayElement(row)]), row.id);
    }
  }

  private ensureSlideNotesColumn(): void {
    const slideColumns = this.db.prepare('PRAGMA table_info(slides)').all() as Array<{ name: string }>;
    if (!slideColumns.some((column) => column.name === 'notes')) {
      this.db.prepare("ALTER TABLE slides ADD COLUMN notes TEXT NOT NULL DEFAULT ''").run();
    }
  }

  getSnapshot(): AppSnapshot {
    const libraries = this.getLibraries();
    const presentations = this.getPresentations();
    const presentationsById = new Map(presentations.map((presentation) => [presentation.id, presentation]));
    const libraryBundles = libraries.map((library) => ({
      library,
      playlists: this.getPlaylistTreesByLibrary(library.id, presentationsById)
    }));

    return {
      libraries,
      libraryBundles,
      presentations,
      slides: this.getSlides(),
      slideElements: this.getSlideElements(),
      mediaAssets: this.getMediaAssets(),
      overlays: this.getOverlays(),
      templates: this.getTemplates(),
    };
  }

  createLibrary(name: string): AppSnapshot {
    const now = nowIso();
    this.db
      .prepare('INSERT INTO libraries (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(createId(), name, now, now);
    return this.getSnapshot();
  }

  createPlaylist(libraryId: Id, name: string): AppSnapshot {
    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlists WHERE library_id = ?').get(libraryId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    this.db
      .prepare('INSERT INTO playlists (id, library_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId(), libraryId, name, currentOrder + 1, now, now);
    return this.getSnapshot();
  }

  createPlaylistSegment(playlistId: Id, name: string): AppSnapshot {
    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlist_segments WHERE playlist_id = ?').get(playlistId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;

    this.db
      .prepare(
        'INSERT INTO playlist_segments (id, playlist_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(createId(), playlistId, name, currentOrder + 1, now, now);

    return this.getSnapshot();
  }

  renamePlaylistSegment(id: Id, name: string): AppSnapshot {
    this.db
      .prepare('UPDATE playlist_segments SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, nowIso(), id);
    return this.getSnapshot();
  }

  setPlaylistSegmentColor(id: Id, colorKey: string | null): AppSnapshot {
    this.db
      .prepare('UPDATE playlist_segments SET color_key = ?, updated_at = ? WHERE id = ?')
      .run(colorKey, nowIso(), id);
    return this.getSnapshot();
  }

  addPresentationToSegment(segmentId: Id, presentationId: Id): AppSnapshot {
    const segment = this.db
      .prepare('SELECT playlist_id FROM playlist_segments WHERE id = ?')
      .get(segmentId) as { playlist_id: string } | undefined;

    if (!segment) return this.getSnapshot();
    return this.movePresentationToSegment(segment.playlist_id, presentationId, segmentId);
  }

  movePresentationToSegment(playlistId: Id, presentationId: Id, segmentId: Id | null): AppSnapshot {
    this.db
      .prepare(
        `DELETE FROM playlist_entries
         WHERE presentation_id = ?
         AND segment_id IN (SELECT id FROM playlist_segments WHERE playlist_id = ?)`
      )
      .run(presentationId, playlistId);

    if (!segmentId) return this.getSnapshot();

    const exists = this.db
      .prepare('SELECT id FROM playlist_segments WHERE id = ? AND playlist_id = ?')
      .get(segmentId, playlistId) as { id: string } | undefined;

    if (!exists) return this.getSnapshot();

    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlist_entries WHERE segment_id = ?').get(segmentId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;

    this.db
      .prepare(
        'INSERT INTO playlist_entries (id, segment_id, presentation_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(createId(), segmentId, presentationId, currentOrder + 1, now, now);

    return this.getSnapshot();
  }

  createPresentation(title: string, kind: PresentationKind = 'canvas'): AppSnapshot {
    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM presentations').get() as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    this.db
      .prepare('INSERT INTO presentations (id, title, kind, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId(), title, this.normalizePresentationKind(kind), currentOrder + 1, now, now);
    return this.getSnapshot();
  }

  createLyric(title: string): AppSnapshot {
    return this.createPresentation(title, 'lyrics');
  }

  createTemplate(input: TemplateCreateInput): AppSnapshot {
    const now = nowIso();
    const templateId = createId();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM templates').get() as { maxOrder: number | null }).maxOrder ?? -1;
    const elements = input.elements ? JSON.parse(JSON.stringify(input.elements)) as SlideElement[] : createDefaultTemplateElements(input.kind, templateId, now);

    this.db
      .prepare(
        `INSERT INTO templates
          (id, name, kind, width, height, order_index, elements_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        templateId,
        input.name,
        this.normalizeTemplateKind(input.kind),
        input.width ?? DEFAULT_W,
        input.height ?? DEFAULT_H,
        currentOrder + 1,
        JSON.stringify(elements),
        now,
        now,
      );
    return this.getSnapshot();
  }

  updateTemplate(input: TemplateUpdateInput): AppSnapshot {
    const existing = this.db
      .prepare('SELECT id, name, kind, width, height, elements_json FROM templates WHERE id = ?')
      .get(input.id) as {
      id: string;
      name: string;
      kind: string;
      width: number;
      height: number;
      elements_json: string;
    } | undefined;

    if (!existing) return this.getSnapshot();

    this.db
      .prepare(
        `UPDATE templates
         SET name = ?, kind = ?, width = ?, height = ?, elements_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.name ?? existing.name,
        this.normalizeTemplateKind(input.kind ?? existing.kind),
        input.width ?? existing.width,
        input.height ?? existing.height,
        JSON.stringify(input.elements ?? parseJson<SlideElement[]>(existing.elements_json)),
        nowIso(),
        input.id,
      );
    return this.getSnapshot();
  }

  deleteTemplate(templateId: Id): AppSnapshot {
    this.db.prepare('DELETE FROM templates WHERE id = ?').run(templateId);
    this.normalizeTemplateOrder();
    return this.getSnapshot();
  }

  applyTemplateToPresentation(templateId: Id, presentationId: Id): AppSnapshot {
    const template = this.getTemplateById(templateId);
    if (!template) return this.getSnapshot();
    const presentation = this.db
      .prepare('SELECT kind FROM presentations WHERE id = ?')
      .get(presentationId) as { kind: string } | undefined;

    if (!presentation || !isTemplateCompatibleWithPresentation(template, this.normalizePresentationKind(presentation.kind))) {
      return this.getSnapshot();
    }

    const slides = this.db
      .prepare('SELECT id FROM slides WHERE presentation_id = ? ORDER BY order_index ASC')
      .all(presentationId) as Array<{ id: string }>;
    const selectElements = this.db
      .prepare(
        `SELECT id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at
         FROM slide_elements
         WHERE slide_id = ?
         ORDER BY layer ASC, z_index ASC, created_at ASC`
      );
    const deleteElements = this.db.prepare('DELETE FROM slide_elements WHERE slide_id = ?');
    const insertElement = this.db.prepare(
      `INSERT INTO slide_elements
        (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const tx = this.db.transaction(() => {
      for (const slide of slides) {
        const currentElements = (selectElements.all(slide.id) as Array<{
          id: string;
          slide_id: string;
          type: SlideElement['type'];
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
          opacity: number;
          z_index: number;
          layer: SlideElement['layer'];
          payload_json: string;
          created_at: string;
          updated_at: string;
        }>).map((row) => ({
          id: row.id,
          slideId: row.slide_id,
          type: row.type,
          x: row.x,
          y: row.y,
          width: row.width,
          height: row.height,
          rotation: row.rotation,
          opacity: row.opacity,
          zIndex: row.z_index,
          layer: row.layer,
          payload: parseJson<SlideElementPayload>(row.payload_json),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        const appliedElements = applyTemplateToElements(template, currentElements, slide.id);
        deleteElements.run(slide.id);
        for (const element of appliedElements) {
          insertElement.run(
            element.id,
            slide.id,
            element.type,
            element.x,
            element.y,
            element.width,
            element.height,
            element.rotation,
            element.opacity,
            element.zIndex,
            element.layer,
            JSON.stringify(element.payload),
            element.createdAt,
            nowIso(),
          );
        }
      }
    });

    tx();
    return this.getSnapshot();
  }

  applyTemplateToOverlay(templateId: Id, overlayId: Id): AppSnapshot {
    const template = this.getTemplateById(templateId);
    if (!template || template.kind !== 'overlays') return this.getSnapshot();
    const existing = this.db
      .prepare('SELECT elements_json FROM overlays WHERE id = ?')
      .get(overlayId) as { elements_json: string } | undefined;

    if (!existing) return this.getSnapshot();

    const currentElements = parseJson<SlideElement[]>(existing.elements_json);
    const appliedElements = applyTemplateToElements(template, currentElements, overlayId);
    const summary = summarizeOverlayElements(appliedElements);
    this.db
      .prepare(
        `UPDATE overlays
         SET type = ?, x = ?, y = ?, width = ?, height = ?, opacity = ?, z_index = ?, payload_json = ?, elements_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        summary.type,
        summary.x,
        summary.y,
        summary.width,
        summary.height,
        summary.opacity,
        summary.zIndex,
        JSON.stringify(summary.payload),
        JSON.stringify(appliedElements),
        nowIso(),
        overlayId,
      );
    return this.getSnapshot();
  }

  setPresentationKind(id: Id, kind: PresentationKind): AppSnapshot {
    this.db
      .prepare('UPDATE presentations SET kind = ?, updated_at = ? WHERE id = ?')
      .run(this.normalizePresentationKind(kind), nowIso(), id);
    return this.getSnapshot();
  }

  movePlaylist(id: Id, direction: 'up' | 'down'): AppSnapshot {
    const current = this.db
      .prepare('SELECT id, library_id, order_index FROM playlists WHERE id = ?')
      .get(id) as { id: string; library_id: string; order_index: number } | undefined;

    if (!current) return this.getSnapshot();

    const neighbor = direction === 'up'
      ? this.db
        .prepare(
          'SELECT id, order_index FROM playlists WHERE library_id = ? AND order_index < ? ORDER BY order_index DESC LIMIT 1'
        )
        .get(current.library_id, current.order_index)
      : this.db
        .prepare(
          'SELECT id, order_index FROM playlists WHERE library_id = ? AND order_index > ? ORDER BY order_index ASC LIMIT 1'
        )
        .get(current.library_id, current.order_index);

    if (!neighbor) return this.getSnapshot();

    const now = nowIso();
    const tx = this.db.transaction(() => {
      this.db
        .prepare('UPDATE playlists SET order_index = ?, updated_at = ? WHERE id = ?')
        .run((neighbor as { order_index: number }).order_index, now, current.id);
      this.db
        .prepare('UPDATE playlists SET order_index = ?, updated_at = ? WHERE id = ?')
        .run(current.order_index, now, (neighbor as { id: string }).id);
    });

    tx();
    return this.getSnapshot();
  }

  movePresentation(id: Id, direction: 'up' | 'down'): AppSnapshot {
    const current = this.db
      .prepare('SELECT id, order_index FROM presentations WHERE id = ?')
      .get(id) as { id: string; order_index: number } | undefined;

    if (!current) return this.getSnapshot();

    const neighbor = direction === 'up'
      ? this.db
        .prepare(
          'SELECT id, order_index FROM presentations WHERE order_index < ? ORDER BY order_index DESC LIMIT 1'
        )
        .get(current.order_index)
      : this.db
        .prepare(
          'SELECT id, order_index FROM presentations WHERE order_index > ? ORDER BY order_index ASC LIMIT 1'
        )
        .get(current.order_index);

    if (!neighbor) return this.getSnapshot();

    const now = nowIso();
    const tx = this.db.transaction(() => {
      this.db
        .prepare('UPDATE presentations SET order_index = ?, updated_at = ? WHERE id = ?')
        .run((neighbor as { order_index: number }).order_index, now, current.id);
      this.db
        .prepare('UPDATE presentations SET order_index = ?, updated_at = ? WHERE id = ?')
        .run(current.order_index, now, (neighbor as { id: string }).id);
    });

    tx();
    return this.getSnapshot();
  }

  createSlide(input: SlideCreateInput): AppSnapshot {
    const now = nowIso();
    const slideId = createId();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM slides WHERE presentation_id = ?').get(input.presentationId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    const presentationRow = this.db
      .prepare('SELECT kind FROM presentations WHERE id = ?')
      .get(input.presentationId) as { kind: string } | undefined;
    const presentationKind = this.normalizePresentationKind(presentationRow?.kind);

    this.db
      .prepare(
        'INSERT INTO slides (id, presentation_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        slideId,
        input.presentationId,
        input.width ?? DEFAULT_W,
        input.height ?? DEFAULT_H,
        '',
        currentOrder + 1,
        now,
        now
      );

    if (presentationKind === 'lyrics') {
      this.db
        .prepare(
          `INSERT INTO slide_elements
            (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          createId(),
          slideId,
          'text',
          180,
          860,
          1560,
          170,
          0,
          1,
          20,
          'content',
          JSON.stringify(this.newLyricsTextPayload()),
          now,
          now
        );
    }

    return this.getSnapshot();
  }

  updateSlideNotes(input: SlideNotesUpdateInput): AppSnapshot {
    const now = nowIso();
    this.db
      .prepare('UPDATE slides SET notes = ?, updated_at = ? WHERE id = ?')
      .run(input.notes, now, input.slideId);
    return this.getSnapshot();
  }

  createElement(input: ElementCreateInput): AppSnapshot {
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO slide_elements
          (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id ?? createId(),
        input.slideId,
        input.type,
        input.x,
        input.y,
        input.width,
        input.height,
        input.rotation ?? 0,
        input.opacity ?? 1,
        input.zIndex ?? 0,
        input.layer ?? this.inferLayer(input.type),
        JSON.stringify(input.payload),
        now,
        now
      );
    return this.getSnapshot();
  }

  createElementsBatch(inputs: ElementCreateInput[]): AppSnapshot {
    if (inputs.length === 0) return this.getSnapshot();
    const now = nowIso();
    const insert = this.db.prepare(
      `INSERT INTO slide_elements
        (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = this.db.transaction((batchInputs: ElementCreateInput[]) => {
      for (const input of batchInputs) {
        insert.run(
          input.id ?? createId(),
          input.slideId,
          input.type,
          input.x,
          input.y,
          input.width,
          input.height,
          input.rotation ?? 0,
          input.opacity ?? 1,
          input.zIndex ?? 0,
          input.layer ?? this.inferLayer(input.type),
          JSON.stringify(input.payload),
          now,
          now
        );
      }
    });
    tx(inputs);
    return this.getSnapshot();
  }

  updateElement(input: ElementUpdateInput): AppSnapshot {
    const now = nowIso();
    const existing = this.db
      .prepare('SELECT * FROM slide_elements WHERE id = ?')
      .get(input.id) as
      | {
          id: string;
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
          opacity: number;
          z_index: number;
          layer: string;
          payload_json: string;
        }
      | undefined;

    if (!existing) return this.getSnapshot();

    this.db
      .prepare(
        `UPDATE slide_elements
         SET x = ?, y = ?, width = ?, height = ?, rotation = ?, opacity = ?, z_index = ?, layer = ?, payload_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.x ?? existing.x,
        input.y ?? existing.y,
        input.width ?? existing.width,
        input.height ?? existing.height,
        input.rotation ?? existing.rotation,
        input.opacity ?? existing.opacity,
        input.zIndex ?? existing.z_index,
        input.layer ?? existing.layer,
        JSON.stringify(input.payload ?? parseJson<SlideElementPayload>(existing.payload_json)),
        now,
        input.id
      );

    return this.getSnapshot();
  }

  updateElementsBatch(inputs: ElementUpdateInput[]): AppSnapshot {
    if (inputs.length === 0) return this.getSnapshot();
    const selectExisting = this.db.prepare('SELECT * FROM slide_elements WHERE id = ?');
    const update = this.db.prepare(
      `UPDATE slide_elements
       SET x = ?, y = ?, width = ?, height = ?, rotation = ?, opacity = ?, z_index = ?, layer = ?, payload_json = ?, updated_at = ?
       WHERE id = ?`
    );
    const tx = this.db.transaction((batchInputs: ElementUpdateInput[]) => {
      for (const input of batchInputs) {
        const existing = selectExisting.get(input.id) as
          | {
              id: string;
              x: number;
              y: number;
              width: number;
              height: number;
              rotation: number;
              opacity: number;
              z_index: number;
              layer: string;
              payload_json: string;
            }
          | undefined;
        if (!existing) continue;
        update.run(
          input.x ?? existing.x,
          input.y ?? existing.y,
          input.width ?? existing.width,
          input.height ?? existing.height,
          input.rotation ?? existing.rotation,
          input.opacity ?? existing.opacity,
          input.zIndex ?? existing.z_index,
          input.layer ?? existing.layer,
          JSON.stringify(input.payload ?? parseJson<SlideElementPayload>(existing.payload_json)),
          nowIso(),
          input.id
        );
      }
    });
    tx(inputs);
    return this.getSnapshot();
  }

  deleteElement(id: Id): AppSnapshot {
    this.db.prepare('DELETE FROM slide_elements WHERE id = ?').run(id);
    return this.getSnapshot();
  }

  deleteElementsBatch(ids: Id[]): AppSnapshot {
    if (ids.length === 0) return this.getSnapshot();
    const del = this.db.prepare('DELETE FROM slide_elements WHERE id = ?');
    const tx = this.db.transaction((batchIds: Id[]) => {
      for (const id of batchIds) del.run(id);
    });
    tx(ids);
    return this.getSnapshot();
  }

  createMediaAsset(asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>): AppSnapshot {
    this.assertMediaSource(asset.src);
    const now = nowIso();
    this.db
      .prepare(
        'INSERT INTO media_assets (id, name, type, src, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(createId(), asset.name, asset.type, asset.src, now, now);
    return this.getSnapshot();
  }

  deleteMediaAsset(id: Id): AppSnapshot {
    this.db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
    return this.getSnapshot();
  }

  updateMediaAssetSrc(id: Id, src: string): AppSnapshot {
    this.assertMediaSource(src);
    this.db.prepare('UPDATE media_assets SET src = ?, updated_at = ? WHERE id = ?').run(src, nowIso(), id);
    return this.getSnapshot();
  }

  createOverlay(input: OverlayCreateInput): AppSnapshot {
    const now = nowIso();
    const elements = input.elements ?? [];
    const summary = summarizeOverlayElements(elements);
    this.db
      .prepare(
        `INSERT INTO overlays
         (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        createId(),
        input.name,
        summary.type,
        summary.x,
        summary.y,
        summary.width,
        summary.height,
        summary.opacity,
        summary.zIndex,
        1,
        JSON.stringify(summary.payload),
        JSON.stringify(elements),
        JSON.stringify(normalizeOverlayAnimation(input.animation ?? { kind: 'none', durationMs: 0, autoClearDurationMs: null })),
        now,
        now
      );

    return this.getSnapshot();
  }

  updateOverlay(input: OverlayUpdateInput): AppSnapshot {
    const existing = this.db
      .prepare('SELECT * FROM overlays WHERE id = ?')
      .get(input.id) as
      | {
      id: string;
      name: string;
      type: Overlay['type'];
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
      z_index: number;
      payload_json: string;
      elements_json: string;
      animation_json: string;
      }
      | undefined;

    if (!existing) return this.getSnapshot();

    const nextElements = input.elements ?? parseJson<SlideElement[]>(existing.elements_json);
    const summary = summarizeOverlayElements(nextElements);

    this.db
      .prepare(
        `UPDATE overlays
         SET name = ?, type = ?, x = ?, y = ?, width = ?, height = ?, opacity = ?, z_index = ?, payload_json = ?, elements_json = ?, animation_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.name ?? existing.name,
        summary.type,
        summary.x,
        summary.y,
        summary.width,
        summary.height,
        summary.opacity,
        summary.zIndex,
        JSON.stringify(summary.payload),
        JSON.stringify(nextElements),
        JSON.stringify(normalizeOverlayAnimation(input.animation ?? parseJson(existing.animation_json))),
        nowIso(),
        input.id,
      );

    return this.getSnapshot();
  }

  renameLibrary(id: Id, name: string): AppSnapshot {
    this.db
      .prepare('UPDATE libraries SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, nowIso(), id);
    return this.getSnapshot();
  }

  renamePlaylist(id: Id, name: string): AppSnapshot {
    this.db
      .prepare('UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, nowIso(), id);
    return this.getSnapshot();
  }

  renamePresentation(id: Id, title: string): AppSnapshot {
    this.db
      .prepare('UPDATE presentations SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, nowIso(), id);
    return this.getSnapshot();
  }

  deleteLibrary(id: Id): AppSnapshot {
    const tx = this.db.transaction((libraryId: Id) => {
      this.db
        .prepare(
          `DELETE FROM playlist_entries
           WHERE segment_id IN (
             SELECT ps.id
             FROM playlist_segments ps
             JOIN playlists p ON p.id = ps.playlist_id
             WHERE p.library_id = ?
           )`
        )
        .run(libraryId);

      this.db
        .prepare(
          `DELETE FROM playlist_segments
           WHERE playlist_id IN (SELECT id FROM playlists WHERE library_id = ?)`
        )
        .run(libraryId);

      this.db
        .prepare('DELETE FROM playlists WHERE library_id = ?')
        .run(libraryId);

      this.db
        .prepare('DELETE FROM libraries WHERE id = ?')
        .run(libraryId);
    });

    tx(id);
    return this.getSnapshot();
  }

  deletePlaylist(id: Id): AppSnapshot {
    const row = this.db
      .prepare('SELECT library_id FROM playlists WHERE id = ?')
      .get(id) as { library_id: string } | undefined;

    const tx = this.db.transaction((playlistId: Id) => {
      this.db
        .prepare(
          `DELETE FROM playlist_entries
           WHERE segment_id IN (SELECT id FROM playlist_segments WHERE playlist_id = ?)`
        )
        .run(playlistId);
      this.db
        .prepare('DELETE FROM playlist_segments WHERE playlist_id = ?')
        .run(playlistId);
      this.db
        .prepare('DELETE FROM playlists WHERE id = ?')
        .run(playlistId);
    });

    tx(id);
    if (row) this.normalizePlaylistOrder(row.library_id);
    return this.getSnapshot();
  }

  deletePlaylistSegment(id: Id): AppSnapshot {
    const tx = this.db.transaction((segmentId: Id) => {
      this.db
        .prepare('DELETE FROM playlist_entries WHERE segment_id = ?')
        .run(segmentId);
      this.db
        .prepare('DELETE FROM playlist_segments WHERE id = ?')
        .run(segmentId);
    });

    tx(id);
    return this.getSnapshot();
  }

  deletePresentation(id: Id): AppSnapshot {
    const tx = this.db.transaction((presentationId: Id) => {
      this.db
        .prepare(
          `DELETE FROM slide_elements
           WHERE slide_id IN (SELECT id FROM slides WHERE presentation_id = ?)`
        )
        .run(presentationId);
      this.db
        .prepare('DELETE FROM slides WHERE presentation_id = ?')
        .run(presentationId);
      this.db
        .prepare('DELETE FROM playlist_entries WHERE presentation_id = ?')
        .run(presentationId);
      this.db
        .prepare('DELETE FROM presentations WHERE id = ?')
        .run(presentationId);
    });

    tx(id);
    this.normalizePresentationOrder();
    return this.getSnapshot();
  }

  setOverlayEnabled(overlayId: Id, enabled: boolean): AppSnapshot {
    this.db
      .prepare('UPDATE overlays SET enabled = ?, updated_at = ? WHERE id = ?')
      .run(enabled ? 1 : 0, nowIso(), overlayId);
    return this.getSnapshot();
  }

  deleteOverlay(overlayId: Id): AppSnapshot {
    this.db.prepare('DELETE FROM overlays WHERE id = ?').run(overlayId);
    return this.getSnapshot();
  }

  private newLyricsTextPayload() {
    return {
      text: 'Verse line one\nVerse line two',
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center' as const,
      verticalAlign: 'middle' as const,
      lineHeight: 1.2,
      caseTransform: 'none' as const,
      weight: '700',
      visible: true,
      locked: false,
      fillEnabled: false,
      fillColor: '#00000000',
      strokeEnabled: false,
      shadowEnabled: false,
    };
  }

  private assertMediaSource(src: string): void {
    if (src.startsWith('blob:')) {
      throw new Error('Transient blob media sources are not allowed. Import from a local file path.');
    }
  }

  private normalizePresentationKind(kind: string | null | undefined): PresentationKind {
    return kind === 'lyrics' ? 'lyrics' : 'canvas';
  }

  private normalizeTemplateKind(kind: string | null | undefined): TemplateKind {
    if (kind === 'lyrics' || kind === 'overlays') return kind;
    return 'slides';
  }

  private inferLayer(type: string): 'background' | 'media' | 'content' {
    if (type === 'shape') return 'background';
    if (type === 'image' || type === 'video') return 'media';
    return 'content';
  }

  private getLibraries(): Library[] {
    const rows = this.db
      .prepare('SELECT id, name, created_at, updated_at FROM libraries ORDER BY created_at ASC')
      .all() as Array<{ id: string; name: string; created_at: string; updated_at: string }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPresentations(): Presentation[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, kind, created_at, updated_at FROM presentations ORDER BY order_index ASC, created_at ASC'
      )
      .all() as Array<{
      id: string;
      title: string;
      kind: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => buildPresentationEntity({
      id: row.id,
      title: row.title,
      kind: this.normalizePresentationKind(row.kind),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getSlides(): Slide[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.presentation_id, s.width, s.height, s.notes, s.order_index, s.created_at, s.updated_at
         FROM slides s
         JOIN presentations p ON p.id = s.presentation_id
         ORDER BY p.order_index ASC, s.order_index ASC`
      )
      .all() as Array<{
      id: string;
      presentation_id: string;
      width: number;
      height: number;
      notes: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      presentationId: row.presentation_id,
      width: row.width,
      height: row.height,
      notes: row.notes,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getSlideElements(): SlideElement[] {
    const rows = this.db
      .prepare(
        `SELECT se.*
         FROM slide_elements se
         JOIN slides s ON s.id = se.slide_id
         JOIN presentations p ON p.id = s.presentation_id
         ORDER BY p.order_index ASC, s.order_index ASC, se.layer ASC, se.z_index ASC`
      )
      .all() as Array<{
      id: string;
      slide_id: string;
      type: SlideElement['type'];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      opacity: number;
      z_index: number;
      layer: SlideElement['layer'];
      payload_json: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      slideId: row.slide_id,
      type: row.type,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      rotation: row.rotation,
      opacity: row.opacity,
      zIndex: row.z_index,
      layer: row.layer,
      payload: parseJson<SlideElementPayload>(row.payload_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPlaylistsByLibrary(libraryId: Id): Playlist[] {
    const rows = this.db
      .prepare('SELECT id, library_id, name, created_at, updated_at FROM playlists WHERE library_id = ? ORDER BY order_index ASC, created_at ASC')
      .all(libraryId) as Array<{ id: string; library_id: string; name: string; created_at: string; updated_at: string }>;

    return rows.map((row) => ({
      id: row.id,
      libraryId: row.library_id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPlaylistSegments(playlistId: Id): PlaylistSegment[] {
    const rows = this.db
      .prepare(
        'SELECT id, playlist_id, name, color_key, order_index, created_at, updated_at FROM playlist_segments WHERE playlist_id = ? ORDER BY order_index ASC'
      )
      .all(playlistId) as Array<{
      id: string;
      playlist_id: string;
      name: string;
      color_key: string | null;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      playlistId: row.playlist_id,
      name: row.name,
      colorKey: row.color_key,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPlaylistEntries(segmentId: Id): PlaylistEntry[] {
    const rows = this.db
      .prepare(
        'SELECT id, segment_id, presentation_id, order_index, created_at, updated_at FROM playlist_entries WHERE segment_id = ? ORDER BY order_index ASC'
      )
      .all(segmentId) as Array<{
      id: string;
      segment_id: string;
      presentation_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      segmentId: row.segment_id,
      presentationId: row.presentation_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPlaylistTreesByLibrary(libraryId: Id, presentationsById: ReadonlyMap<Id, Presentation>): PlaylistTree[] {
    return this.getPlaylistsByLibrary(libraryId).map((playlist) => {
      const segments = this.getPlaylistSegments(playlist.id).map((segment) => {
        const entries = this.getPlaylistEntries(segment.id)
          .map((entry) => {
            const presentation = presentationsById.get(entry.presentationId);
            if (!presentation) return null;
            return { entry, presentation };
          })
          .filter((value): value is { entry: PlaylistEntry; presentation: Presentation } => value !== null);

        return { segment, entries };
      });

      return {
        playlist,
        segments
      };
    });
  }

  private getMediaAssets(): MediaAsset[] {
    const rows = this.db
      .prepare(
        'SELECT id, name, type, src, created_at, updated_at FROM media_assets ORDER BY created_at ASC, id ASC'
      )
      .all() as Array<{
      id: string;
      name: string;
      type: MediaAsset['type'];
      src: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      src: row.src,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getOverlays(): Overlay[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, created_at, updated_at
         FROM overlays
         ORDER BY created_at ASC, id ASC`
      )
      .all() as Array<{
      id: string;
      name: string;
      type: Overlay['type'];
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
      z_index: number;
      enabled: number;
      payload_json: string;
      elements_json: string;
      animation_json: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      opacity: row.opacity,
      zIndex: row.z_index,
      enabled: row.enabled === 1,
      payload: parseJson(row.payload_json),
      elements: parseJson<SlideElement[]>(row.elements_json),
      animation: normalizeOverlayAnimation(parseJson(row.animation_json)),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getTemplates(): Template[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, kind, width, height, order_index, elements_json, created_at, updated_at
         FROM templates
         ORDER BY order_index ASC, created_at ASC`
      )
      .all() as Array<{
      id: string;
      name: string;
      kind: string;
      width: number;
      height: number;
      order_index: number;
      elements_json: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      kind: this.normalizeTemplateKind(row.kind),
      width: row.width,
      height: row.height,
      order: row.order_index,
      elements: parseJson<SlideElement[]>(row.elements_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getTemplateById(templateId: Id): Template | null {
    return this.getTemplates().find((template) => template.id === templateId) ?? null;
  }

  private normalizePlaylistOrder(libraryId: Id): void {
    this.db
      .prepare(
        `WITH ranked AS (
           SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC, created_at ASC, id ASC) - 1 AS next_order
           FROM playlists
           WHERE library_id = ?
         )
         UPDATE playlists
         SET order_index = (SELECT next_order FROM ranked WHERE ranked.id = playlists.id)
         WHERE library_id = ?`
      )
      .run(libraryId, libraryId);
  }

  private normalizePresentationOrder(): void {
    this.db
      .prepare(
        `WITH ranked AS (
           SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC, created_at ASC, id ASC) - 1 AS next_order
           FROM presentations
         )
         UPDATE presentations
         SET order_index = (SELECT next_order FROM ranked WHERE ranked.id = presentations.id)
         WHERE id IN (SELECT id FROM ranked)`
      )
      .run();
  }

  private normalizeTemplateOrder(): void {
    const templates = this.db
      .prepare('SELECT id FROM templates ORDER BY order_index ASC, created_at ASC')
      .all() as Array<{ id: string }>;
    const update = this.db.prepare('UPDATE templates SET order_index = ?, updated_at = ? WHERE id = ?');
    const now = nowIso();

    const tx = this.db.transaction(() => {
      templates.forEach((template, index) => {
        update.run(index, now, template.id);
      });
    });

    tx();
  }
}
