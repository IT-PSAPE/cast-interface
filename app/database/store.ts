import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import {
  cloneDeckBundleManifest,
  collectDeckBundleMediaReferences,
  readElementMediaReference,
} from '@core/deck-bundles';
import { buildDeckItem } from '@core/deck-items';
import { applyTemplateToElements, createDefaultTemplateElements, isTemplateCompatibleWithDeckItem, syncTemplateToElements } from '@core/templates';
import { createId, nowIso } from '@core/utils';
import { SqliteDatabase } from './sqlite';
import type {
  AppSnapshot,
  BrokenDeckBundleReference,
  Collection,
  CollectionAssignmentInput,
  CollectionBinKind,
  CollectionCreateInput,
  CollectionDeleteInput,
  CollectionItemType,
  CollectionRenameInput,
  CollectionReorderInput,
  DeckBundleBrokenReferenceDecision,
  DeckBundleExportOptions,
  DeckBundleInspection,
  DeckBundleInspectionOverlay,
  DeckBundleInspectionStage,
  DeckBundleInspectionTemplate,
  DeckBundleItem,
  DeckBundleManifest,
  DeckBundleOverlay,
  DeckBundleSlide,
  DeckBundleStage,
  DeckBundleTemplate,
  DeckItem,
  DeckItemType,
  Presentation,
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  Library,
  LibraryPlaylistBundle,
  Lyric,
  MediaAsset,
  MediaAssetCreateInput,
  Overlay,
  OverlayCreateInput,
  OverlayUpdateInput,
  Playlist,
  PlaylistEntry,
  PlaylistSegment,
  PlaylistTree,
  Slide,
  SlideElement,
  SlideElementPayload,
  SlideCreateInput,
  SlideNotesUpdateInput,
  SlideOrderUpdateInput,
  Stage,
  StageCreateInput,
  StageUpdateInput,
  Template,
  TemplateCreateInput,
  TemplateKind,
  TemplateUpdateInput,
} from '@core/types';
import { isBrokenMediaSource, toCastMediaSource } from './media-source-utils';
import type { SnapshotPatch } from '@core/snapshot-patch';

const DEFAULT_W = 1920;
const DEFAULT_H = 1080;
const TEMPLATES_SCHEMA_VERSION = 4;
const DECK_ITEMS_SCHEMA_VERSION = 6;
const REORDER_SCHEMA_VERSION = 7;
const STAGES_SCHEMA_VERSION = 8;
const COLLECTIONS_SCHEMA_VERSION = 9;
const LATEST_SCHEMA_VERSION = COLLECTIONS_SCHEMA_VERSION;
const GLOBAL_SCHEMA_VERSION = 3;
const LEGACY_SCHEMA_VERSION = 2;

const COLLECTION_BIN_KINDS: readonly CollectionBinKind[] = ['deck', 'image', 'video', 'audio', 'template', 'overlay', 'stage'];

const COLLECTION_TABLE_BY_BIN: Record<CollectionBinKind, string> = {
  deck: 'deck_collections',
  image: 'image_collections',
  video: 'video_collections',
  audio: 'audio_collections',
  template: 'template_collections',
  overlay: 'overlay_collections',
  stage: 'stage_collections',
};

const DEFAULT_COLLECTION_NAME = 'Default Collection';

const ITEM_TABLE_BY_TYPE: Record<CollectionItemType, string> = {
  presentation: 'presentations',
  lyric: 'lyrics',
  media_asset: 'media_assets',
  template: 'templates',
  overlay: 'overlays',
  stage: 'stages',
};

function isItemTypeAllowedInBin(
  itemType: CollectionItemType,
  binKind: CollectionBinKind,
  itemId: Id,
  store: CastRepository,
): boolean {
  if (itemType === 'presentation' || itemType === 'lyric') return binKind === 'deck';
  if (itemType === 'template') return binKind === 'template';
  if (itemType === 'overlay') return binKind === 'overlay';
  if (itemType === 'stage') return binKind === 'stage';
  if (itemType === 'media_asset') {
    if (binKind !== 'image' && binKind !== 'video' && binKind !== 'audio') return false;
    const assetType = store.peekMediaAssetType(itemId);
    if (!assetType) return false;
    if (binKind === 'audio') return assetType === 'audio';
    if (binKind === 'image') return assetType === 'image';
    if (binKind === 'video') return assetType === 'video' || assetType === 'animation';
  }
  return false;
}

function buildPatchSpecForItemType(itemType: CollectionItemType, itemId: Id): {
  upsertPresentationIds?: Id[];
  upsertLyricIds?: Id[];
  upsertMediaAssetIds?: Id[];
  upsertTemplateIds?: Id[];
  upsertOverlayIds?: Id[];
  upsertStageIds?: Id[];
} {
  switch (itemType) {
    case 'presentation': return { upsertPresentationIds: [itemId] };
    case 'lyric': return { upsertLyricIds: [itemId] };
    case 'media_asset': return { upsertMediaAssetIds: [itemId] };
    case 'template': return { upsertTemplateIds: [itemId] };
    case 'overlay': return { upsertOverlayIds: [itemId] };
    case 'stage': return { upsertStageIds: [itemId] };
  }
}

interface DeckOwnerRow {
  type: DeckItemType;
  templateId: string | null;
}

interface BrokenReferenceAccumulator {
  elementTypes: Set<'image' | 'video'>;
  occurrenceCount: number;
  itemTitles: Set<string>;
  templateNames: Set<string>;
  overlayNames: Set<string>;
  stageNames: Set<string>;
}

const parseJson = <T>(value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[DB] Failed to parse JSON:', error, value.slice(0, 200));
    throw new Error(`Corrupted JSON data in database: ${(error as Error).message}`);
  }
};

// One-shot rename of a pre-rename Recast database (and its WAL/SHM/backups)
// to the new LumaCast filename. Runs before the SQLite handle is opened so
// existing user data carries over after the brand rename.
function migrateLegacyRecastDatabase(userData: string, targetDbPath: string): void {
  if (fs.existsSync(targetDbPath)) return;
  const legacyDbPath = path.join(userData, 'recast.sqlite');
  if (!fs.existsSync(legacyDbPath)) return;
  try {
    fs.renameSync(legacyDbPath, targetDbPath);
    for (const suffix of ['-wal', '-shm']) {
      const legacy = legacyDbPath + suffix;
      if (fs.existsSync(legacy)) fs.renameSync(legacy, targetDbPath + suffix);
    }
    for (const entry of fs.readdirSync(userData)) {
      const match = entry.match(/^recast\.bak-v(\d+)\.sqlite$/);
      if (!match) continue;
      fs.renameSync(path.join(userData, entry), path.join(userData, `lumacast.bak-v${match[1]}.sqlite`));
    }
    console.info('[DB] Migrated legacy recast.sqlite -> lumacast.sqlite');
  } catch (error) {
    console.error('[DB] Failed to migrate legacy recast database:', error);
  }
}

function toDeckBundleTemplate(template: Template): DeckBundleTemplate {
  return {
    id: template.id,
    name: template.name,
    kind: template.kind,
    width: template.width,
    height: template.height,
    order: template.order,
    elements: template.elements,
  };
}

function toDeckBundleOverlay(overlay: Overlay): DeckBundleOverlay {
  return {
    id: overlay.id,
    name: overlay.name,
    type: overlay.type,
    x: overlay.x,
    y: overlay.y,
    width: overlay.width,
    height: overlay.height,
    opacity: overlay.opacity,
    zIndex: overlay.zIndex,
    enabled: overlay.enabled,
    elements: overlay.elements,
    animation: overlay.animation,
  };
}

function toDeckBundleStage(stage: Stage): DeckBundleStage {
  return {
    id: stage.id,
    name: stage.name,
    width: stage.width,
    height: stage.height,
    order: stage.order,
    elements: stage.elements,
  };
}

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
    ? rawKind
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
  private db: SqliteDatabase;
  private patchVersion = 0;
  private readonly dbPath: string;

  constructor() {
    const userData = app.getPath('userData');
    this.dbPath = path.join(userData, 'lumacast.sqlite');
    migrateLegacyRecastDatabase(userData, this.dbPath);
    this.db = new SqliteDatabase(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeSchema();
    this.seedIfEmpty();
  }

  private initializeSchema(): void {
    const currentVersion = this.getUserVersion();

    if (this.hasTable('libraries') && currentVersion < LATEST_SCHEMA_VERSION) {
      this.backupBeforeMigration(currentVersion);
    }

    if (currentVersion === 0) {
      if (!this.hasTable('libraries')) {
        this.createGlobalSchema();
        this.setUserVersion(LATEST_SCHEMA_VERSION);
        this.seedDefaultCollections();
        return;
      }

      this.prepareLegacySchema();
      this.setUserVersion(LEGACY_SCHEMA_VERSION);
    }

    if (this.getUserVersion() < GLOBAL_SCHEMA_VERSION) {
      this.migrateLegacyProjectContentToGlobalScope();
    }

    if (this.getUserVersion() < TEMPLATES_SCHEMA_VERSION) {
      this.ensureTemplatesSchema();
    }

    if (this.getUserVersion() < 5) {
      this.ensurePresentationTemplateSchema();
      this.setUserVersion(5);
    }

    if (this.getUserVersion() < DECK_ITEMS_SCHEMA_VERSION) {
      this.migratePresentationSchemaToDeckItems();
      this.setUserVersion(DECK_ITEMS_SCHEMA_VERSION);
    }

    if (this.getUserVersion() < REORDER_SCHEMA_VERSION) {
      this.ensureReorderColumns();
      this.setUserVersion(REORDER_SCHEMA_VERSION);
    }

    if (this.getUserVersion() < STAGES_SCHEMA_VERSION) {
      this.ensureStagesSchema();
      this.setUserVersion(STAGES_SCHEMA_VERSION);
    }

    if (this.getUserVersion() < COLLECTIONS_SCHEMA_VERSION) {
      this.ensureCollectionsSchema();
      this.setUserVersion(COLLECTIONS_SCHEMA_VERSION);
    }
  }

  /**
   * Schema v7 — add `order_index` to `libraries` and `media_assets` so they
   * can be reordered via drag-and-drop. Back-fills the column from the
   * existing `created_at` order so nothing appears to move after upgrade.
   */
  private ensureReorderColumns(): void {
    const tx = this.db.transaction(() => {
      if (!this.hasColumn('libraries', 'order_index')) {
        this.db.exec('ALTER TABLE libraries ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0');
        this.db.exec(`
          WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) - 1 AS rank FROM libraries
          )
          UPDATE libraries SET order_index = (SELECT rank FROM ranked WHERE ranked.id = libraries.id);
        `);
      }
      if (!this.hasColumn('media_assets', 'order_index')) {
        this.db.exec('ALTER TABLE media_assets ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0');
        this.db.exec(`
          WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) - 1 AS rank FROM media_assets
          )
          UPDATE media_assets SET order_index = (SELECT rank FROM ranked WHERE ranked.id = media_assets.id);
        `);
      }
    });
    tx();
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_libraries_order_index ON libraries(order_index);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_media_assets_order_index ON media_assets(order_index);');
  }

  private backupBeforeMigration(fromVersion: number): void {
    const backupPath = path.join(path.dirname(this.dbPath), `lumacast.bak-v${fromVersion}.sqlite`);
    try {
      fs.rmSync(backupPath, { force: true });
      const escaped = backupPath.replace(/'/g, "''");
      this.db.exec(`VACUUM INTO '${escaped}'`);
      console.info(`[DB] Pre-migration backup written to ${backupPath}`);
    } catch (error) {
      // Migrations are additive and idempotent, so a failed backup must not block startup.
      console.error('[DB] Pre-migration backup failed (continuing):', error);
    }
  }

  private hasColumn(tableName: string, columnName: string): boolean {
    const rows = this.db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
    return rows.some((row) => row.name === columnName);
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
        order_index INTEGER NOT NULL DEFAULT 0,
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

      CREATE TABLE IF NOT EXISTS stages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
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
      CREATE INDEX IF NOT EXISTS idx_stages_order_index ON stages(order_index);
    `);
  }

  private createGlobalSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS presentations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        template_id TEXT,
        collection_id TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lyrics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        template_id TEXT,
        collection_id TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        presentation_id TEXT,
        lyric_id TEXT,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(presentation_id) REFERENCES presentations(id),
        FOREIGN KEY(lyric_id) REFERENCES lyrics(id)
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
        presentation_id TEXT,
        lyric_id TEXT,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(segment_id) REFERENCES playlist_segments(id),
        FOREIGN KEY(presentation_id) REFERENCES presentations(id),
        FOREIGN KEY(lyric_id) REFERENCES lyrics(id)
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        src TEXT NOT NULL,
        collection_id TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
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
        collection_id TEXT,
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
        collection_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        elements_json TEXT NOT NULL DEFAULT '[]',
        collection_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS deck_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS image_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS video_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audio_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS template_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS overlay_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stage_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.createCommonIndexes();
    this.createGlobalContentIndexes();
    this.createCollectionsIndexes();
  }

  private createCommonIndexes(): void {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
      CREATE INDEX IF NOT EXISTS idx_slides_lyric_id ON slides(lyric_id);
      CREATE INDEX IF NOT EXISTS idx_slide_elements_slide_id ON slide_elements(slide_id);
      CREATE INDEX IF NOT EXISTS idx_playlists_library_id ON playlists(library_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_segments_playlist_id ON playlist_segments(playlist_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_entries_segment_id ON playlist_entries(segment_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_entries_presentation_id ON playlist_entries(presentation_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_entries_lyric_id ON playlist_entries(lyric_id);
    `);
  }

  private createGlobalContentIndexes(): void {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_decks_order_index ON presentations(order_index);
      CREATE INDEX IF NOT EXISTS idx_decks_template_id ON presentations(template_id);
      CREATE INDEX IF NOT EXISTS idx_lyrics_order_index ON lyrics(order_index);
      CREATE INDEX IF NOT EXISTS idx_lyrics_template_id ON lyrics(template_id);
      CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
      CREATE INDEX IF NOT EXISTS idx_overlays_created_at ON overlays(created_at);
      CREATE INDEX IF NOT EXISTS idx_templates_order_index ON templates(order_index);
      CREATE INDEX IF NOT EXISTS idx_stages_order_index ON stages(order_index);
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

  private ensureStagesSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        elements_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_stages_order_index ON stages(order_index)');
  }

  private createCollectionsIndexes(): void {
    for (const table of Object.values(COLLECTION_TABLE_BY_BIN)) {
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_order_index ON ${table}(order_index);`);
    }
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_presentations_collection_id ON presentations(collection_id);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_lyrics_collection_id ON lyrics(collection_id);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_media_assets_collection_id ON media_assets(collection_id);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_overlays_collection_id ON overlays(collection_id);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_templates_collection_id ON templates(collection_id);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_stages_collection_id ON stages(collection_id);');
  }

  private ensureCollectionsSchema(): void {
    const tx = this.db.transaction(() => {
      for (const table of Object.values(COLLECTION_TABLE_BY_BIN)) {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS ${table} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      }

      const itemTablesNeedingColumn = ['presentations', 'lyrics', 'media_assets', 'templates', 'overlays', 'stages'];
      for (const table of itemTablesNeedingColumn) {
        if (this.hasTable(table) && !this.hasColumn(table, 'collection_id')) {
          this.db.exec(`ALTER TABLE ${table} ADD COLUMN collection_id TEXT;`);
        }
      }
    });
    tx();
    this.createCollectionsIndexes();
    this.seedDefaultCollections();
  }

  private getDefaultCollectionId(binKind: CollectionBinKind): Id {
    const table = COLLECTION_TABLE_BY_BIN[binKind];
    const row = this.db
      .prepare(`SELECT id FROM ${table} WHERE is_default = 1 ORDER BY created_at ASC LIMIT 1`)
      .get() as { id: string } | undefined;
    if (!row) {
      // Defensive: seed if somehow missing (e.g. deleted by hand). Idempotent.
      this.seedDefaultCollections();
      const retry = this.db
        .prepare(`SELECT id FROM ${table} WHERE is_default = 1 ORDER BY created_at ASC LIMIT 1`)
        .get() as { id: string } | undefined;
      if (!retry) throw new Error(`Default collection missing for bin: ${binKind}`);
      return retry.id;
    }
    return row.id;
  }

  private getMediaAssetDefaultCollectionId(type: MediaAsset['type']): Id {
    if (type === 'audio') return this.getDefaultCollectionId('audio');
    if (type === 'video' || type === 'animation') return this.getDefaultCollectionId('video');
    return this.getDefaultCollectionId('image');
  }

  private seedDefaultCollections(): void {
    const tx = this.db.transaction(() => {
      const now = nowIso();
      const defaultIds: Record<CollectionBinKind, string> = {} as Record<CollectionBinKind, string>;

      for (const bin of COLLECTION_BIN_KINDS) {
        const table = COLLECTION_TABLE_BY_BIN[bin];
        const existing = this.db
          .prepare(`SELECT id FROM ${table} WHERE is_default = 1 LIMIT 1`)
          .get() as { id: string } | undefined;

        if (existing) {
          defaultIds[bin] = existing.id;
          continue;
        }

        const id = createId();
        this.db
          .prepare(
            `INSERT INTO ${table} (id, name, order_index, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(id, DEFAULT_COLLECTION_NAME, 0, 1, now, now);
        defaultIds[bin] = id;
      }

      this.db
        .prepare('UPDATE presentations SET collection_id = ? WHERE collection_id IS NULL')
        .run(defaultIds.deck);
      if (this.hasTable('lyrics')) {
        this.db
          .prepare('UPDATE lyrics SET collection_id = ? WHERE collection_id IS NULL')
          .run(defaultIds.deck);
      }
      this.db
        .prepare("UPDATE media_assets SET collection_id = ? WHERE collection_id IS NULL AND type = 'image'")
        .run(defaultIds.image);
      this.db
        .prepare("UPDATE media_assets SET collection_id = ? WHERE collection_id IS NULL AND type = 'video'")
        .run(defaultIds.video);
      this.db
        .prepare("UPDATE media_assets SET collection_id = ? WHERE collection_id IS NULL AND type = 'audio'")
        .run(defaultIds.audio);
      this.db
        .prepare('UPDATE templates SET collection_id = ? WHERE collection_id IS NULL')
        .run(defaultIds.template);
      this.db
        .prepare('UPDATE overlays SET collection_id = ? WHERE collection_id IS NULL')
        .run(defaultIds.overlay);
      this.db
        .prepare('UPDATE stages SET collection_id = ? WHERE collection_id IS NULL')
        .run(defaultIds.stage);
    });
    tx();
  }

  peekMediaAssetType(itemId: Id): MediaAsset['type'] | null {
    const row = this.db.prepare('SELECT type FROM media_assets WHERE id = ?').get(itemId) as { type: MediaAsset['type'] } | undefined;
    return row?.type ?? null;
  }

  private getCollectionBinKindByCollectionId(collectionId: Id): CollectionBinKind | null {
    for (const bin of COLLECTION_BIN_KINDS) {
      const table = COLLECTION_TABLE_BY_BIN[bin];
      const row = this.db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(collectionId) as { id: string } | undefined;
      if (row) return bin;
    }
    return null;
  }

  private getCollections(): Collection[] {
    const out: Collection[] = [];
    for (const bin of COLLECTION_BIN_KINDS) {
      const table = COLLECTION_TABLE_BY_BIN[bin];
      const rows = this.db
        .prepare(`SELECT id, name, order_index, is_default, created_at, updated_at FROM ${table} ORDER BY order_index ASC, created_at ASC`)
        .all() as Array<{
        id: string;
        name: string;
        order_index: number;
        is_default: number;
        created_at: string;
        updated_at: string;
      }>;
      for (const row of rows) {
        out.push({
          id: row.id,
          binKind: bin,
          name: row.name,
          order: row.order_index,
          isDefault: row.is_default === 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    }
    return out;
  }

  private getCollectionsByIds(ids: Id[]): Collection[] {
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    return this.getCollections().filter((collection) => idSet.has(collection.id));
  }

  createCollection(input: CollectionCreateInput): SnapshotPatch {
    const table = COLLECTION_TABLE_BY_BIN[input.binKind];
    const now = nowIso();
    const id = createId();
    const nextOrder =
      ((this.db.prepare(`SELECT MAX(order_index) AS maxOrder FROM ${table}`).get() as { maxOrder: number | null }).maxOrder ?? -1) + 1;
    this.db
      .prepare(`INSERT INTO ${table} (id, name, order_index, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, input.name, nextOrder, 0, now, now);
    return this.buildPatch({ upsertCollectionIds: [id] });
  }

  renameCollection(input: CollectionRenameInput): SnapshotPatch {
    const table = COLLECTION_TABLE_BY_BIN[input.binKind];
    const existing = this.db.prepare(`SELECT id, is_default FROM ${table} WHERE id = ?`).get(input.id) as
      | { id: string; is_default: number }
      | undefined;
    if (!existing) return this.buildPatch({});
    if (existing.is_default === 1) {
      throw new Error('Default collection cannot be renamed');
    }
    this.db
      .prepare(`UPDATE ${table} SET name = ?, updated_at = ? WHERE id = ?`)
      .run(input.name, nowIso(), input.id);
    return this.buildPatch({ upsertCollectionIds: [input.id] });
  }

  deleteCollection(input: CollectionDeleteInput): SnapshotPatch {
    const table = COLLECTION_TABLE_BY_BIN[input.binKind];
    const existing = this.db.prepare(`SELECT id, is_default FROM ${table} WHERE id = ?`).get(input.id) as
      | { id: string; is_default: number }
      | undefined;
    if (!existing) return this.buildPatch({});
    if (existing.is_default === 1) {
      throw new Error('Default collection cannot be deleted');
    }

    const defaultId = this.getDefaultCollectionId(input.binKind);
    const movedIds = this.reassignItemsForCollection(input.binKind, input.id, defaultId);

    this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(input.id);

    return this.buildPatch({
      deletedCollectionIds: [input.id],
      upsertPresentationIds: movedIds.presentations,
      upsertLyricIds: movedIds.lyrics,
      upsertMediaAssetIds: movedIds.mediaAssets,
      upsertTemplateIds: movedIds.templates,
      upsertOverlayIds: movedIds.overlays,
      upsertStageIds: movedIds.stages,
    });
  }

  reorderCollections(input: CollectionReorderInput): SnapshotPatch {
    const table = COLLECTION_TABLE_BY_BIN[input.binKind];
    const now = nowIso();
    const tx = this.db.transaction(() => {
      input.ids.forEach((id, index) => {
        this.db.prepare(`UPDATE ${table} SET order_index = ?, updated_at = ? WHERE id = ?`).run(index, now, id);
      });
    });
    tx();
    return this.buildPatch({ upsertCollectionIds: input.ids });
  }

  setItemCollection(input: CollectionAssignmentInput): SnapshotPatch {
    const itemTable = ITEM_TABLE_BY_TYPE[input.itemType];
    const exists = this.db.prepare(`SELECT id FROM ${itemTable} WHERE id = ?`).get(input.itemId) as
      | { id: string }
      | undefined;
    if (!exists) return this.buildPatch({});

    const targetBin = this.getCollectionBinKindByCollectionId(input.collectionId);
    if (!targetBin) {
      throw new Error(`Unknown target collection: ${input.collectionId}`);
    }
    if (!isItemTypeAllowedInBin(input.itemType, targetBin, input.itemId, this)) {
      throw new Error(`Item type ${input.itemType} cannot be moved into bin ${targetBin}`);
    }

    this.db
      .prepare(`UPDATE ${itemTable} SET collection_id = ?, updated_at = ? WHERE id = ?`)
      .run(input.collectionId, nowIso(), input.itemId);

    return this.buildPatch(buildPatchSpecForItemType(input.itemType, input.itemId));
  }

  private reassignItemsForCollection(
    binKind: CollectionBinKind,
    fromCollectionId: Id,
    toCollectionId: Id,
  ): {
    presentations: Id[];
    lyrics: Id[];
    mediaAssets: Id[];
    templates: Id[];
    overlays: Id[];
    stages: Id[];
  } {
    const moved = {
      presentations: [] as Id[],
      lyrics: [] as Id[],
      mediaAssets: [] as Id[],
      templates: [] as Id[],
      overlays: [] as Id[],
      stages: [] as Id[],
    };
    const now = nowIso();

    const reassign = (table: string, bucket: Id[]) => {
      const rows = this.db.prepare(`SELECT id FROM ${table} WHERE collection_id = ?`).all(fromCollectionId) as Array<{ id: string }>;
      for (const row of rows) {
        bucket.push(row.id);
      }
      this.db
        .prepare(`UPDATE ${table} SET collection_id = ?, updated_at = ? WHERE collection_id = ?`)
        .run(toCollectionId, now, fromCollectionId);
    };

    switch (binKind) {
      case 'deck':
        reassign('presentations', moved.presentations);
        reassign('lyrics', moved.lyrics);
        break;
      case 'image':
      case 'video':
      case 'audio':
        reassign('media_assets', moved.mediaAssets);
        break;
      case 'template':
        reassign('templates', moved.templates);
        break;
      case 'overlay':
        reassign('overlays', moved.overlays);
        break;
      case 'stage':
        reassign('stages', moved.stages);
        break;
    }

    return moved;
  }

  private ensurePresentationTemplateSchema(): void {
    const presentationColumns = this.db.prepare('PRAGMA table_info(presentations)').all() as Array<{ name: string }>;
    if (!presentationColumns.some((column) => column.name === 'template_id')) {
      this.db.prepare('ALTER TABLE presentations ADD COLUMN template_id TEXT').run();
    }
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_presentations_template_id ON presentations(template_id)');
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
            template_id TEXT,
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
          INSERT INTO presentations_v3 (id, title, kind, template_id, order_index, created_at, updated_at)
          SELECT
            p.id,
            p.title,
            p.kind,
            NULL,
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

        this.setUserVersion(GLOBAL_SCHEMA_VERSION);
      });

      tx();
    } finally {
      this.db.pragma(`foreign_keys = ${previousForeignKeys ? 'ON' : 'OFF'}`);
    }
  }

  private migratePresentationSchemaToDeckItems(): void {
    const previousForeignKeys = this.db.pragma('foreign_keys', { simple: true }) as number;
    this.db.pragma('foreign_keys = OFF');

    try {
      const tx = this.db.transaction(() => {
        this.db.exec(`
          CREATE TABLE decks_v6 (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            template_id TEXT,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE lyrics_v6 (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            template_id TEXT,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE slides_v6 (
            id TEXT PRIMARY KEY,
            presentation_id TEXT,
            lyric_id TEXT,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            order_index INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE playlist_entries_v6 (
            id TEXT PRIMARY KEY,
            segment_id TEXT NOT NULL,
            presentation_id TEXT,
            lyric_id TEXT,
            order_index INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);

        this.db.exec(`
          INSERT INTO decks_v6 (id, title, template_id, order_index, created_at, updated_at)
          SELECT id, title, template_id, order_index, created_at, updated_at
          FROM presentations
          WHERE kind != 'lyrics'
          ORDER BY order_index ASC, created_at ASC, id ASC;

          INSERT INTO lyrics_v6 (id, title, template_id, order_index, created_at, updated_at)
          SELECT id, title, template_id, order_index, created_at, updated_at
          FROM presentations
          WHERE kind = 'lyrics'
          ORDER BY order_index ASC, created_at ASC, id ASC;

          INSERT INTO slides_v6 (id, presentation_id, lyric_id, width, height, notes, order_index, created_at, updated_at)
          SELECT
            s.id,
            CASE WHEN p.kind = 'lyrics' THEN NULL ELSE s.presentation_id END,
            CASE WHEN p.kind = 'lyrics' THEN s.presentation_id ELSE NULL END,
            s.width,
            s.height,
            s.notes,
            s.order_index,
            s.created_at,
            s.updated_at
          FROM slides s
          JOIN presentations p ON p.id = s.presentation_id
          ORDER BY s.created_at ASC, s.id ASC;

          INSERT INTO playlist_entries_v6 (id, segment_id, presentation_id, lyric_id, order_index, created_at, updated_at)
          SELECT
            pe.id,
            pe.segment_id,
            CASE WHEN p.kind = 'lyrics' THEN NULL ELSE pe.presentation_id END,
            CASE WHEN p.kind = 'lyrics' THEN pe.presentation_id ELSE NULL END,
            pe.order_index,
            pe.created_at,
            pe.updated_at
          FROM playlist_entries pe
          JOIN presentations p ON p.id = pe.presentation_id
          ORDER BY pe.created_at ASC, pe.id ASC;
        `);

        this.db.exec(`
          DROP INDEX IF EXISTS idx_slides_presentation_id;
          DROP INDEX IF EXISTS idx_playlist_entries_presentation_id;
          DROP INDEX IF EXISTS idx_presentations_order_index;
          DROP INDEX IF EXISTS idx_presentations_template_id;

          DROP TABLE playlist_entries;
          DROP TABLE slides;
          DROP TABLE presentations;

          ALTER TABLE decks_v6 RENAME TO presentations;
          ALTER TABLE lyrics_v6 RENAME TO lyrics;
          ALTER TABLE slides_v6 RENAME TO slides;
          ALTER TABLE playlist_entries_v6 RENAME TO playlist_entries;
        `);

        this.createCommonIndexes();
        this.createGlobalContentIndexes();
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

      const deckCollectionId = this.getDefaultCollectionId('deck');
      this.db
        .prepare('INSERT INTO presentations (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(presentationId, 'Welcome Slides', null, deckCollectionId, 0, now, now);

      this.db
        .prepare(
          'INSERT INTO slides (id, presentation_id, lyric_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(slideId, presentationId, null, DEFAULT_W, DEFAULT_H, '', 0, now, now);

      const titlePayload = JSON.stringify({
        text: 'Welcome to LumaCast',
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
          'INSERT INTO playlist_entries (id, segment_id, presentation_id, lyric_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(createId(), segmentId, presentationId, null, 0, now, now);

      const overlayCollectionId = this.getDefaultCollectionId('overlay');
      this.db
        .prepare(
          `INSERT INTO overlays (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, collection_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          overlayCollectionId,
          now,
          now
        );
    });

    tx();
  }

  private migrateMediaSrcProtocol(): void {
    const tx = this.db.transaction(() => {
      const assets = this.db
        .prepare("SELECT id, src FROM media_assets WHERE src LIKE 'cast-media://%' OR src LIKE 'file://%' OR src LIKE 'blob:%'")
        .all() as Array<{ id: string; src: string }>;

      const updateAsset = this.db.prepare('UPDATE media_assets SET src = ? WHERE id = ?');
      const deleteAsset = this.db.prepare('DELETE FROM media_assets WHERE id = ?');
      for (const asset of assets) {
        const newSrc = toCastMediaSource(asset.src);
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
        const newSrc = toCastMediaSource(payload.src);
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
    const lyrics = this.getLyrics();
    const itemsById = new Map<Id, DeckItem>([
      ...presentations.map((deck) => [deck.id, deck] as const),
      ...lyrics.map((lyric) => [lyric.id, lyric] as const),
    ]);
    const libraryBundles = libraries.map((library) => ({
      library,
      playlists: this.getPlaylistTreesByLibrary(library.id, itemsById)
    }));

    return {
      libraries,
      libraryBundles,
      presentations,
      lyrics,
      slides: this.getSlides(),
      slideElements: this.getSlideElements(),
      mediaAssets: this.getMediaAssets(),
      overlays: this.getOverlays(),
      templates: this.getTemplates(),
      stages: this.getStages(),
      collections: this.getCollections(),
    };
  }

  /**
   * Wipe every data table and re-insert the rows described by `snapshot`.
   * Used by global undo/redo: the renderer holds the pre-mutation snapshot
   * and asks the repo to swap the on-disk state to match. Wrapped in a
   * single transaction so a partial failure rolls back to the prior state.
   */
  restoreFromSnapshot(snapshot: AppSnapshot): AppSnapshot {
    const tx = this.db.transaction(() => {
      this.db.exec(`
        DELETE FROM playlist_entries;
        DELETE FROM slide_elements;
        DELETE FROM slides;
        DELETE FROM playlist_segments;
        DELETE FROM playlists;
        DELETE FROM presentations;
        DELETE FROM lyrics;
        DELETE FROM media_assets;
        DELETE FROM overlays;
        DELETE FROM templates;
        DELETE FROM stages;
        DELETE FROM libraries;
      `);

      const insertLibrary = this.db.prepare(
        'INSERT INTO libraries (id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      for (const library of snapshot.libraries) {
        insertLibrary.run(library.id, library.name, library.order, library.createdAt, library.updatedAt);
      }

      const insertTemplate = this.db.prepare(
        `INSERT INTO templates (id, name, kind, width, height, order_index, elements_json, collection_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const template of snapshot.templates) {
        insertTemplate.run(
          template.id,
          template.name,
          template.kind,
          template.width,
          template.height,
          template.order,
          JSON.stringify(template.elements),
          template.collectionId,
          template.createdAt,
          template.updatedAt,
        );
      }

      const insertPresentation = this.db.prepare(
        'INSERT INTO presentations (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const presentation of snapshot.presentations) {
        insertPresentation.run(
          presentation.id,
          presentation.title,
          presentation.templateId ?? null,
          presentation.collectionId,
          presentation.order,
          presentation.createdAt,
          presentation.updatedAt,
        );
      }

      const insertLyric = this.db.prepare(
        'INSERT INTO lyrics (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const lyric of snapshot.lyrics) {
        insertLyric.run(
          lyric.id,
          lyric.title,
          lyric.templateId ?? null,
          lyric.collectionId,
          lyric.order,
          lyric.createdAt,
          lyric.updatedAt,
        );
      }

      const insertSlide = this.db.prepare(
        'INSERT INTO slides (id, presentation_id, lyric_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const slide of snapshot.slides) {
        insertSlide.run(
          slide.id,
          slide.presentationId,
          slide.lyricId,
          slide.width,
          slide.height,
          slide.notes,
          slide.order,
          slide.createdAt,
          slide.updatedAt,
        );
      }

      const insertSlideElement = this.db.prepare(
        `INSERT INTO slide_elements
          (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const element of snapshot.slideElements) {
        insertSlideElement.run(
          element.id,
          element.slideId,
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
          element.updatedAt,
        );
      }

      const insertPlaylist = this.db.prepare(
        'INSERT INTO playlists (id, library_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const insertSegment = this.db.prepare(
        'INSERT INTO playlist_segments (id, playlist_id, name, color_key, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      const insertEntry = this.db.prepare(
        'INSERT INTO playlist_entries (id, segment_id, presentation_id, lyric_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const bundle of snapshot.libraryBundles) {
        for (const tree of bundle.playlists) {
          insertPlaylist.run(
            tree.playlist.id,
            tree.playlist.libraryId,
            tree.playlist.name,
            tree.playlist.order,
            tree.playlist.createdAt,
            tree.playlist.updatedAt,
          );
          for (const { segment, entries } of tree.segments) {
            insertSegment.run(
              segment.id,
              segment.playlistId,
              segment.name,
              segment.colorKey,
              segment.order,
              segment.createdAt,
              segment.updatedAt,
            );
            for (const { entry } of entries) {
              insertEntry.run(
                entry.id,
                entry.segmentId,
                entry.presentationId,
                entry.lyricId,
                entry.order,
                entry.createdAt,
                entry.updatedAt,
              );
            }
          }
        }
      }

      const insertMediaAsset = this.db.prepare(
        'INSERT INTO media_assets (id, name, type, src, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const asset of snapshot.mediaAssets) {
        insertMediaAsset.run(
          asset.id,
          asset.name,
          asset.type,
          asset.src,
          asset.collectionId,
          asset.order,
          asset.createdAt,
          asset.updatedAt,
        );
      }

      const insertOverlay = this.db.prepare(
        `INSERT INTO overlays
          (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, collection_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const overlay of snapshot.overlays) {
        insertOverlay.run(
          overlay.id,
          overlay.name,
          overlay.type,
          overlay.x,
          overlay.y,
          overlay.width,
          overlay.height,
          overlay.opacity,
          overlay.zIndex,
          overlay.enabled ? 1 : 0,
          JSON.stringify(overlay.payload),
          JSON.stringify(overlay.elements),
          JSON.stringify(overlay.animation),
          overlay.collectionId,
          overlay.createdAt,
          overlay.updatedAt,
        );
      }

      const insertStage = this.db.prepare(
        `INSERT INTO stages (id, name, width, height, order_index, elements_json, collection_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const stage of snapshot.stages) {
        insertStage.run(
          stage.id,
          stage.name,
          stage.width,
          stage.height,
          stage.order,
          JSON.stringify(stage.elements),
          stage.collectionId,
          stage.createdAt,
          stage.updatedAt,
        );
      }
    });
    tx();
    this.patchVersion += 1;
    return this.getSnapshot();
  }

  exportDeckBundle(itemIds: Id[], options: DeckBundleExportOptions = {}): DeckBundleManifest {
    const uniqueIds = Array.from(new Set(itemIds));
    const items = uniqueIds
      .map((itemId) => this.getDeckBundleItemById(itemId))
      .filter((item): item is DeckBundleItem => item !== null)
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));

    const templates = options.includeAllTemplates
      ? this.getTemplates().map(toDeckBundleTemplate)
      : Array.from(new Set(items.map((item) => item.templateId).filter((id): id is Id => Boolean(id))))
          .map((templateId) => this.getDeckBundleTemplateById(templateId))
          .filter((template): template is DeckBundleTemplate => template !== null)
          .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));

    const overlays = options.includeOverlays
      ? this.getOverlays().map(toDeckBundleOverlay)
      : [];

    const stages = options.includeStages
      ? this.getStages().map(toDeckBundleStage)
      : [];

    return {
      format: 'cast-deck-bundle',
      version: 1,
      exportedAt: nowIso(),
      items,
      templates,
      overlays,
      stages,
      mediaReferences: collectDeckBundleMediaReferences(items, templates, overlays, stages),
    };
  }

  inspectImportBundle(manifest: DeckBundleManifest): DeckBundleInspection {
    this.assertValidDeckBundleManifest(manifest);
    const normalizedManifest = cloneDeckBundleManifest(manifest);
    const overlays = normalizedManifest.overlays ?? [];
    const stages = normalizedManifest.stages ?? [];
    const mediaReferences = collectDeckBundleMediaReferences(
      normalizedManifest.items,
      normalizedManifest.templates,
      overlays,
      stages,
    );
    const brokenReferences = this.collectBrokenBundleReferences(normalizedManifest);

    return {
      exportedAt: normalizedManifest.exportedAt,
      itemCount: normalizedManifest.items.length,
      templateCount: normalizedManifest.templates.length,
      mediaReferenceCount: mediaReferences.length,
      overlayCount: overlays.length,
      stageCount: stages.length,
      items: normalizedManifest.items
        .map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          slideCount: item.slides.length,
          templateId: item.templateId,
        }))
        .sort((left, right) => left.title.localeCompare(right.title)),
      templates: normalizedManifest.templates
        .map((template): DeckBundleInspectionTemplate => ({
          id: template.id,
          name: template.name,
          kind: template.kind,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      overlays: overlays
        .map((overlay): DeckBundleInspectionOverlay => ({ id: overlay.id, name: overlay.name, type: overlay.type }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      stages: stages
        .map((stage): DeckBundleInspectionStage => ({ id: stage.id, name: stage.name }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      mediaReferences,
      brokenReferences,
    };
  }

  finalizeImportBundle(manifest: DeckBundleManifest, decisions: DeckBundleBrokenReferenceDecision[]): AppSnapshot {
    this.assertValidDeckBundleManifest(manifest);
    const workingManifest = cloneDeckBundleManifest(manifest);
    const brokenReferences = this.collectBrokenBundleReferences(workingManifest);
    const decisionMap = new Map(decisions.map((decision) => [decision.source, decision]));

    for (const reference of brokenReferences) {
      const decision = decisionMap.get(reference.source);
      if (!decision) {
        throw new Error(`Missing import decision for broken source: ${reference.source}`);
      }
      if (decision.action === 'replace' && !decision.replacementPath) {
        throw new Error(`Replacement path is required for ${reference.source}`);
      }
    }

    this.applyBrokenReferenceDecisions(workingManifest, decisionMap);

    const now = nowIso();
    const nextTemplateOrder = this.getNextTemplateOrderIndex();
    const nextContentOrder = this.getMaxDeckOrder() + 1;
    const nextMediaAssetOrder = this.getNextMediaAssetOrderIndex();
    const normalizedReplacementSources = this.collectReplacementMediaSources(brokenReferences, decisionMap);

    const insertTemplate = this.db.prepare(
      `INSERT INTO templates
        (id, name, kind, width, height, order_index, elements_json, collection_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertPresentation = this.db.prepare(
      'INSERT INTO presentations (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertLyric = this.db.prepare(
      'INSERT INTO lyrics (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertSlide = this.db.prepare(
      'INSERT INTO slides (id, presentation_id, lyric_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertElement = this.db.prepare(
      `INSERT INTO slide_elements
        (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMediaAsset = this.db.prepare(
      'INSERT INTO media_assets (id, name, type, src, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertOverlay = this.db.prepare(
      `INSERT INTO overlays
       (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, collection_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertStage = this.db.prepare(
      `INSERT INTO stages (id, name, width, height, order_index, elements_json, collection_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const nextStageOrder = (this.db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM stages').get() as { next_order: number }).next_order;
    const importDeckCollectionId = this.getDefaultCollectionId('deck');
    const importTemplateCollectionId = this.getDefaultCollectionId('template');
    const importOverlayCollectionId = this.getDefaultCollectionId('overlay');
    const importStageCollectionId = this.getDefaultCollectionId('stage');

    const tx = this.db.transaction(() => {
      const templateIdMap = new Map<Id, Id>();
      const replacementAssetKeys = new Set<string>();

      workingManifest.templates
        .slice()
        .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
        .forEach((template, index) => {
          const newTemplateId = createId();
          templateIdMap.set(template.id, newTemplateId);
          const nextElements = template.elements.map((element, elementIndex) =>
            this.createImportedTemplateElement(element, newTemplateId, now, elementIndex)
          );
          insertTemplate.run(
            newTemplateId,
            template.name,
            this.normalizeTemplateKind(template.kind),
            template.width,
            template.height,
            nextTemplateOrder + index,
            JSON.stringify(nextElements),
            importTemplateCollectionId,
            now,
            now,
          );
        });

      normalizedReplacementSources.forEach((replacementSource, replacementIndex) => {
        const assetType = this.inferImportedMediaAssetType(replacementSource.elementTypes, replacementSource.src);
        const assetKey = `${replacementSource.src}:${assetType}`;
        if (replacementAssetKeys.has(assetKey)) return;
        replacementAssetKeys.add(assetKey);
        insertMediaAsset.run(
          createId(),
          path.basename(replacementSource.rawPath),
          assetType,
          replacementSource.src,
          this.getMediaAssetDefaultCollectionId(assetType),
          nextMediaAssetOrder + replacementIndex,
          now,
          now,
        );
      });

      workingManifest.items
        .slice()
        .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
        .forEach((item, itemIndex) => {
          const newItemId = createId();
          const importedTemplateId = item.templateId ? templateIdMap.get(item.templateId) ?? null : null;
          if (item.templateId && !importedTemplateId) {
            throw new Error(`Missing imported template for ${item.title}`);
          }
          if (importedTemplateId) {
            const importedTemplate = workingManifest.templates.find((template) => template.id === item.templateId) ?? null;
            if (!importedTemplate || !isTemplateCompatibleWithDeckItem(importedTemplate as Template, item.type)) {
              throw new Error(`Template ${item.templateId} is incompatible with ${item.title}`);
            }
          }

          if (item.type === 'presentation') {
            insertPresentation.run(newItemId, item.title, importedTemplateId, importDeckCollectionId, nextContentOrder + itemIndex, now, now);
          } else {
            insertLyric.run(newItemId, item.title, importedTemplateId, importDeckCollectionId, nextContentOrder + itemIndex, now, now);
          }

          item.slides
            .slice()
            .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
            .forEach((slide, slideIndex) => {
              const newSlideId = createId();
              insertSlide.run(
                newSlideId,
                item.type === 'presentation' ? newItemId : null,
                item.type === 'lyric' ? newItemId : null,
                slide.width,
                slide.height,
                slide.notes,
                slideIndex,
                now,
                now,
              );

              slide.elements.forEach((element, elementIndex) => {
                const nextElement = this.createImportedSlideElement(element, newSlideId, now, elementIndex);
                insertElement.run(
                  nextElement.id,
                  newSlideId,
                  nextElement.type,
                  nextElement.x,
                  nextElement.y,
                  nextElement.width,
                  nextElement.height,
                  nextElement.rotation,
                  nextElement.opacity,
                  nextElement.zIndex,
                  nextElement.layer,
                  JSON.stringify(nextElement.payload),
                  now,
                  now,
                );
              });
            });
        });

      (workingManifest.overlays ?? []).forEach((overlay) => {
        const summary = summarizeOverlayElements(overlay.elements);
        insertOverlay.run(
          createId(),
          overlay.name,
          summary.type,
          summary.x,
          summary.y,
          summary.width,
          summary.height,
          summary.opacity,
          summary.zIndex,
          overlay.enabled ? 1 : 0,
          JSON.stringify(summary.payload),
          JSON.stringify(overlay.elements),
          JSON.stringify(normalizeOverlayAnimation(overlay.animation)),
          importOverlayCollectionId,
          now,
          now,
        );
      });

      (workingManifest.stages ?? []).forEach((stage, stageIndex) => {
        insertStage.run(
          createId(),
          stage.name,
          stage.width,
          stage.height,
          nextStageOrder + stageIndex,
          JSON.stringify(stage.elements),
          importStageCollectionId,
          now,
          now,
        );
      });
    });

    tx();
    return this.getSnapshot();
  }

  createLibrary(name: string): SnapshotPatch {
    const now = nowIso();
    const libraryId = createId();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM libraries').get() as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    this.db
      .prepare('INSERT INTO libraries (id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(libraryId, name, currentOrder + 1, now, now);
    return this.buildPatch({ upsertLibraryIds: [libraryId], replaceLibraryBundles: true });
  }

  createPlaylist(libraryId: Id, name: string): SnapshotPatch {
    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlists WHERE library_id = ?').get(libraryId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    this.db
      .prepare('INSERT INTO playlists (id, library_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId(), libraryId, name, currentOrder + 1, now, now);
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  createPlaylistSegment(playlistId: Id, name: string): SnapshotPatch {
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

    return this.buildPatch({ replaceLibraryBundles: true });
  }

  renamePlaylistSegment(id: Id, name: string): SnapshotPatch {
    this.db
      .prepare('UPDATE playlist_segments SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, nowIso(), id);
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  setPlaylistSegmentColor(id: Id, colorKey: string | null): SnapshotPatch {
    this.db
      .prepare('UPDATE playlist_segments SET color_key = ?, updated_at = ? WHERE id = ?')
      .run(colorKey, nowIso(), id);
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  addDeckItemToSegment(segmentId: Id, itemId: Id): SnapshotPatch {
    const owner = this.resolveDeckOwnerRow(itemId);
    if (!owner) return this.buildPatch({});

    const exists = this.db
      .prepare('SELECT id FROM playlist_segments WHERE id = ?')
      .get(segmentId) as { id: string } | undefined;

    if (!exists) return this.buildPatch({});

    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlist_entries WHERE segment_id = ?').get(segmentId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;

    this.db
      .prepare(
        `INSERT INTO playlist_entries (id, segment_id, presentation_id, lyric_id, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        createId(),
        segmentId,
        owner.type === 'presentation' ? itemId : null,
        owner.type === 'lyric' ? itemId : null,
        currentOrder + 1,
        now,
        now,
      );

    return this.buildPatch({ replaceLibraryBundles: true });
  }

  moveDeckItemToSegment(playlistId: Id, itemId: Id, segmentId: Id | null): SnapshotPatch {
    const owner = this.resolveDeckOwnerRow(itemId);
    if (!owner) return this.buildPatch({});
    const ownerColumn = this.getDeckOwnerColumn(owner.type);

    this.db
      .prepare(
        `DELETE FROM playlist_entries
         WHERE (${ownerColumn} = ?)
         AND segment_id IN (SELECT id FROM playlist_segments WHERE playlist_id = ?)`
      )
      .run(itemId, playlistId);

    if (!segmentId) return this.buildPatch({ replaceLibraryBundles: true });

    const exists = this.db
      .prepare('SELECT id FROM playlist_segments WHERE id = ? AND playlist_id = ?')
      .get(segmentId, playlistId) as { id: string } | undefined;

    if (!exists) return this.buildPatch({ replaceLibraryBundles: true });

    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlist_entries WHERE segment_id = ?').get(segmentId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;

    this.db
      .prepare(
        `INSERT INTO playlist_entries (id, segment_id, presentation_id, lyric_id, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        createId(),
        segmentId,
        owner.type === 'presentation' ? itemId : null,
        owner.type === 'lyric' ? itemId : null,
        currentOrder + 1,
        now,
        now,
      );

    return this.buildPatch({ replaceLibraryBundles: true });
  }

  movePlaylistEntry(entryId: Id, direction: 'up' | 'down'): AppSnapshot {
    const current = this.db
      .prepare('SELECT id, segment_id, order_index FROM playlist_entries WHERE id = ?')
      .get(entryId) as { id: string; segment_id: string; order_index: number } | undefined;

    if (!current) return this.getSnapshot();

    const neighbor = direction === 'up'
      ? this.db
        .prepare(
          'SELECT id, order_index FROM playlist_entries WHERE segment_id = ? AND order_index < ? ORDER BY order_index DESC LIMIT 1'
        )
        .get(current.segment_id, current.order_index)
      : this.db
        .prepare(
          'SELECT id, order_index FROM playlist_entries WHERE segment_id = ? AND order_index > ? ORDER BY order_index ASC LIMIT 1'
        )
        .get(current.segment_id, current.order_index);

    if (!neighbor) return this.getSnapshot();

    const now = nowIso();
    const tx = this.db.transaction(() => {
      this.db
        .prepare('UPDATE playlist_entries SET order_index = ?, updated_at = ? WHERE id = ?')
        .run((neighbor as { order_index: number }).order_index, now, current.id);
      this.db
        .prepare('UPDATE playlist_entries SET order_index = ?, updated_at = ? WHERE id = ?')
        .run(current.order_index, now, (neighbor as { id: string }).id);
    });

    tx();
    return this.getSnapshot();
  }

  movePlaylistEntryToSegment(entryId: Id, segmentId: Id | null): SnapshotPatch {
    const entry = this.db
      .prepare(
        `SELECT pe.id, pe.segment_id, ps.playlist_id
         FROM playlist_entries pe
         JOIN playlist_segments ps ON ps.id = pe.segment_id
         WHERE pe.id = ?`
      )
      .get(entryId) as { id: string; segment_id: string; playlist_id: string } | undefined;

    if (!entry) return this.buildPatch({});

    if (!segmentId) {
      this.db
        .prepare('DELETE FROM playlist_entries WHERE id = ?')
        .run(entryId);
      return this.buildPatch({ replaceLibraryBundles: true });
    }

    const targetSegment = this.db
      .prepare('SELECT id FROM playlist_segments WHERE id = ? AND playlist_id = ?')
      .get(segmentId, entry.playlist_id) as { id: string } | undefined;

    if (!targetSegment) return this.buildPatch({});

    const now = nowIso();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM playlist_entries WHERE segment_id = ?').get(segmentId) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;

    this.db
      .prepare('UPDATE playlist_entries SET segment_id = ?, order_index = ?, updated_at = ? WHERE id = ?')
      .run(segmentId, currentOrder + 1, now, entryId);

    return this.buildPatch({ replaceLibraryBundles: true });
  }

  createPresentation(title: string): SnapshotPatch {
    const now = nowIso();
    const presentationId = createId();
    const currentOrder = this.getMaxDeckOrder();
    const deckCollectionId = this.getDefaultCollectionId('deck');
    this.db
      .prepare('INSERT INTO presentations (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(presentationId, title, null, deckCollectionId, currentOrder + 1, now, now);
    return this.buildPatch({ upsertPresentationIds: [presentationId] });
  }

  createLyric(title: string): SnapshotPatch {
    const now = nowIso();
    const lyricId = createId();
    const currentOrder = this.getMaxDeckOrder();
    const deckCollectionId = this.getDefaultCollectionId('deck');
    this.db
      .prepare('INSERT INTO lyrics (id, title, template_id, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(lyricId, title, null, deckCollectionId, currentOrder + 1, now, now);
    return this.buildPatch({ upsertLyricIds: [lyricId] });
  }

  createTemplate(input: TemplateCreateInput): SnapshotPatch {
    const now = nowIso();
    const templateId = createId();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM templates').get() as { maxOrder: number | null }).maxOrder ?? -1;
    const elements = input.elements ? JSON.parse(JSON.stringify(input.elements)) as SlideElement[] : createDefaultTemplateElements(input.kind, templateId, now);
    const collectionId = input.collectionId ?? this.getDefaultCollectionId('template');

    this.db
      .prepare(
        `INSERT INTO templates
          (id, name, kind, width, height, order_index, elements_json, collection_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        templateId,
        input.name,
        this.normalizeTemplateKind(input.kind),
        input.width ?? DEFAULT_W,
        input.height ?? DEFAULT_H,
        currentOrder + 1,
        JSON.stringify(elements),
        collectionId,
        now,
        now,
      );
    return this.buildPatch({ upsertTemplateIds: [templateId] });
  }

  updateTemplate(input: TemplateUpdateInput): SnapshotPatch {
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

    if (!existing) return this.buildPatch({});

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
    return this.buildPatch({ upsertTemplateIds: [input.id] });
  }

  deleteTemplate(templateId: Id): SnapshotPatch {
    const affectedPresentationIds = (this.db
      .prepare('SELECT id FROM presentations WHERE template_id = ?')
      .all(templateId) as Array<{ id: string }>)
      .map((row) => row.id);
    const affectedLyricIds = (this.db
      .prepare('SELECT id FROM lyrics WHERE template_id = ?')
      .all(templateId) as Array<{ id: string }>)
      .map((row) => row.id);
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE presentations SET template_id = NULL, updated_at = ? WHERE template_id = ?').run(nowIso(), templateId);
      this.db.prepare('UPDATE lyrics SET template_id = NULL, updated_at = ? WHERE template_id = ?').run(nowIso(), templateId);
      this.db.prepare('DELETE FROM templates WHERE id = ?').run(templateId);
    });
    tx();
    this.normalizeTemplateOrder();
    const remainingTemplateIds = (this.db.prepare('SELECT id FROM templates ORDER BY order_index ASC').all() as Array<{ id: string }>).map((row) => row.id);
    return this.buildPatch({
      upsertPresentationIds: affectedPresentationIds,
      upsertLyricIds: affectedLyricIds,
      upsertTemplateIds: remainingTemplateIds,
      deletedTemplateIds: [templateId],
      replaceLibraryBundles: true,
    });
  }

  applyTemplateToDeckItem(templateId: Id, itemId: Id): SnapshotPatch {
    const template = this.getTemplateById(templateId);
    if (!template) return this.buildPatch({});
    const owner = this.resolveDeckOwnerRow(itemId);
    if (!owner || !isTemplateCompatibleWithDeckItem(template, owner.type)) {
      return this.buildPatch({});
    }

    const ownerColumn = this.getDeckOwnerColumn(owner.type);
    const ownerTable = this.getDeckTableName(owner.type);

    const slides = this.db
      .prepare(`SELECT id FROM slides WHERE ${ownerColumn} = ? ORDER BY order_index ASC`)
      .all(itemId) as Array<{ id: string }>;
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

    const deletedElementIds: Id[] = [];
    const tx = this.db.transaction(() => {
      this.db.prepare(`UPDATE ${ownerTable} SET template_id = ?, updated_at = ? WHERE id = ?`).run(templateId, nowIso(), itemId);
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
        deletedElementIds.push(...currentElements.map((element) => element.id));
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
    return this.buildPatch({
      upsertPresentationIds: owner.type === 'presentation' ? [itemId] : undefined,
      upsertLyricIds: owner.type === 'lyric' ? [itemId] : undefined,
      upsertSlideElementIds: this.getSlideElementIdsBySlideIds(slides.map((slide) => slide.id)),
      deletedSlideElementIds: deletedElementIds,
      replaceLibraryBundles: true,
    });
  }

  syncTemplateToLinkedDeckItems(templateId: Id): SnapshotPatch {
    const template = this.getTemplateById(templateId);
    if (!template) return this.buildPatch({});

    const presentations = this.db
      .prepare('SELECT id FROM presentations WHERE template_id = ?')
      .all(templateId) as Array<{ id: string }>;
    const lyrics = this.db
      .prepare('SELECT id FROM lyrics WHERE template_id = ?')
      .all(templateId) as Array<{ id: string }>;

    const linkedItems: Array<{ id: string; type: DeckItemType }> = [
      ...(template.kind === 'slides' ? presentations.map((row) => ({ id: row.id, type: 'presentation' as DeckItemType })) : []),
      ...(template.kind === 'lyrics' ? lyrics.map((row) => ({ id: row.id, type: 'lyric' as DeckItemType })) : []),
    ];

    if (linkedItems.length === 0) return this.buildPatch({});

    const selectElements = this.db.prepare(
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

    const touchedSlideIds: string[] = [];
    const deletedElementIds: Id[] = [];
    const tx = this.db.transaction(() => {
      for (const item of linkedItems) {
        const ownerColumn = this.getDeckOwnerColumn(item.type);
        const slides = this.db
          .prepare(`SELECT id FROM slides WHERE ${ownerColumn} = ? ORDER BY order_index ASC`)
          .all(item.id) as Array<{ id: string }>;
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
          const syncedElements = syncTemplateToElements(template, currentElements, slide.id);
          deletedElementIds.push(...currentElements.map((element) => element.id));
          deleteElements.run(slide.id);
          for (const element of syncedElements) {
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
          touchedSlideIds.push(slide.id);
        }
      }
    });

    tx();

    const presentationIds = linkedItems.filter((item) => item.type === 'presentation').map((item) => item.id);
    const lyricIds = linkedItems.filter((item) => item.type === 'lyric').map((item) => item.id);

    return this.buildPatch({
      upsertPresentationIds: presentationIds.length > 0 ? presentationIds : undefined,
      upsertLyricIds: lyricIds.length > 0 ? lyricIds : undefined,
      upsertSlideElementIds: this.getSlideElementIdsBySlideIds(touchedSlideIds),
      deletedSlideElementIds: deletedElementIds,
      replaceLibraryBundles: true,
    });
  }

  detachTemplateFromDeckItem(itemId: Id): SnapshotPatch {
    const owner = this.resolveDeckOwnerRow(itemId);
    if (!owner || owner.templateId === null) return this.buildPatch({});

    const ownerTable = this.getDeckTableName(owner.type);
    this.db.prepare(`UPDATE ${ownerTable} SET template_id = NULL, updated_at = ? WHERE id = ?`).run(nowIso(), itemId);
    return this.buildPatch({
      upsertPresentationIds: owner.type === 'presentation' ? [itemId] : undefined,
      upsertLyricIds: owner.type === 'lyric' ? [itemId] : undefined,
      replaceLibraryBundles: true,
    });
  }

  applyTemplateToOverlay(templateId: Id, overlayId: Id): SnapshotPatch {
    const template = this.getTemplateById(templateId);
    if (!template || template.kind !== 'overlays') return this.buildPatch({});
    const existing = this.db
      .prepare('SELECT elements_json FROM overlays WHERE id = ?')
      .get(overlayId) as { elements_json: string } | undefined;

    if (!existing) return this.buildPatch({});

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
    return this.buildPatch({ upsertOverlayIds: [overlayId] });
  }

  movePlaylist(id: Id, direction: 'up' | 'down'): SnapshotPatch {
    const current = this.db
      .prepare('SELECT id, library_id, order_index FROM playlists WHERE id = ?')
      .get(id) as { id: string; library_id: string; order_index: number } | undefined;

    if (!current) return this.buildPatch({});

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

    if (!neighbor) return this.buildPatch({});

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
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  moveDeckItem(id: Id, direction: 'up' | 'down'): SnapshotPatch {
    const orderedItems = this.getOrderedContentReferences();
    const currentIndex = orderedItems.findIndex((item) => item.id === id);
    if (currentIndex === -1) return this.buildPatch({});

    const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const neighbor = orderedItems[neighborIndex] ?? null;
    const current = orderedItems[currentIndex];
    if (!current || !neighbor) return this.buildPatch({});

    const now = nowIso();
    const tx = this.db.transaction(() => {
      this.db
        .prepare(`UPDATE ${this.getDeckTableName(current.type)} SET order_index = ?, updated_at = ? WHERE id = ?`)
        .run(neighbor.order, now, current.id);
      this.db
        .prepare(`UPDATE ${this.getDeckTableName(neighbor.type)} SET order_index = ?, updated_at = ? WHERE id = ?`)
        .run(current.order, now, neighbor.id);
    });

    tx();
    return this.buildPatch({
      upsertPresentationIds: [current, neighbor].filter((item) => item.type === 'presentation').map((item) => item.id),
      upsertLyricIds: [current, neighbor].filter((item) => item.type === 'lyric').map((item) => item.id),
      replaceLibraryBundles: true,
    });
  }

  createSlide(input: SlideCreateInput): SnapshotPatch {
    const owner = this.resolveSlideOwnerInput(input);
    if (!owner) return this.buildPatch({});

    const now = nowIso();
    const slideId = createId();
    const ownerColumn = this.getDeckOwnerColumn(owner.type);
    const currentOrder =
      (this.db.prepare(`SELECT MAX(order_index) AS maxOrder FROM slides WHERE ${ownerColumn} = ?`).get(owner.id) as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    const assignedTemplate = owner.templateId ? this.getTemplateById(owner.templateId) : null;
    const appliedTemplate = assignedTemplate && isTemplateCompatibleWithDeckItem(assignedTemplate, owner.type)
      ? assignedTemplate
      : null;
    const insertElement = this.db.prepare(
      `INSERT INTO slide_elements
        (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    this.db
      .prepare(
        'INSERT INTO slides (id, presentation_id, lyric_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        slideId,
        owner.type === 'presentation' ? owner.id : null,
        owner.type === 'lyric' ? owner.id : null,
        input.width ?? DEFAULT_W,
        input.height ?? DEFAULT_H,
        '',
        currentOrder + 1,
        now,
        now
      );

    const initialElements = appliedTemplate
      ? applyTemplateToElements(appliedTemplate, [], slideId)
      : owner.type === 'lyric'
        ? [{
          id: createId(),
          slideId,
          type: 'text' as const,
          x: 180,
          y: 860,
          width: 1560,
          height: 170,
          rotation: 0,
          opacity: 1,
          zIndex: 20,
          layer: 'content' as const,
          payload: this.newLyricsTextPayload(),
          createdAt: now,
          updatedAt: now,
        }]
        : [];

    for (const element of initialElements) {
      insertElement.run(
        element.id,
        slideId,
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
        now,
        now,
      );
    }

    return this.buildPatch({
      upsertSlideIds: [slideId],
      upsertSlideElementIds: initialElements.map((element) => element.id),
    });
  }

  deleteSlide(slideId: Id): SnapshotPatch {
    const slide = this.db
      .prepare('SELECT presentation_id, lyric_id FROM slides WHERE id = ?')
      .get(slideId) as { presentation_id: string | null; lyric_id: string | null } | undefined;

    if (!slide) return this.buildPatch({});

    const ownerColumn = slide.presentation_id ? 'presentation_id' : 'lyric_id';
    const ownerId = slide.presentation_id ?? slide.lyric_id;
    if (!ownerId) return this.buildPatch({});
    const deletedElementIds = this.getSlideElementIdsBySlideIds([slideId]);

    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM slide_elements WHERE slide_id = ?').run(slideId);
      this.db.prepare('DELETE FROM slides WHERE id = ?').run(slideId);
      this.normalizeSlideOrder(ownerColumn, ownerId);
    });

    tx();
    return this.buildPatch({
      upsertSlideIds: this.getSlideIdsForOwner(ownerColumn, ownerId),
      deletedSlideIds: [slideId],
      deletedSlideElementIds: deletedElementIds,
    });
  }

  updateSlideNotes(input: SlideNotesUpdateInput): SnapshotPatch {
    const now = nowIso();
    this.db
      .prepare('UPDATE slides SET notes = ?, updated_at = ? WHERE id = ?')
      .run(input.notes, now, input.slideId);
    return this.buildPatch({ upsertSlideIds: [input.slideId] });
  }

  duplicateSlide(slideId: Id): SnapshotPatch {
    const original = this.db
      .prepare('SELECT id, presentation_id, lyric_id, width, height, notes, order_index FROM slides WHERE id = ?')
      .get(slideId) as {
        id: string;
        presentation_id: string | null;
        lyric_id: string | null;
        width: number;
        height: number;
        notes: string | null;
        order_index: number;
      } | undefined;
    if (!original) return this.buildPatch({});

    const ownerColumn = original.presentation_id !== null ? 'presentation_id' : 'lyric_id';
    const ownerValue = original.presentation_id ?? original.lyric_id;
    if (!ownerValue) return this.buildPatch({});

    const now = nowIso();
    const newSlideId = createId();
    const insertOrder = original.order_index + 1;

    const elements = this.db
      .prepare(
        `SELECT type, x, y, width, height, rotation, opacity, z_index, layer, payload_json
         FROM slide_elements WHERE slide_id = ? ORDER BY layer ASC, z_index ASC, created_at ASC`
      )
      .all(slideId) as Array<{
        type: SlideElement['type'];
        x: number; y: number; width: number; height: number;
        rotation: number; opacity: number; z_index: number;
        layer: SlideElement['layer']; payload_json: string;
      }>;

    const shiftOrder = this.db.prepare(
      `UPDATE slides SET order_index = order_index + 1, updated_at = ? WHERE ${ownerColumn} = ? AND order_index >= ?`
    );
    const insertSlide = this.db.prepare(
      'INSERT INTO slides (id, presentation_id, lyric_id, width, height, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertElement = this.db.prepare(
      `INSERT INTO slide_elements
        (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const newElementIds: Id[] = [];
    const tx = this.db.transaction(() => {
      shiftOrder.run(now, ownerValue, insertOrder);
      insertSlide.run(
        newSlideId,
        original.presentation_id,
        original.lyric_id,
        original.width,
        original.height,
        original.notes ?? '',
        insertOrder,
        now,
        now,
      );
      for (const el of elements) {
        const elementId = createId();
        newElementIds.push(elementId);
        insertElement.run(
          elementId,
          newSlideId,
          el.type,
          el.x, el.y, el.width, el.height,
          el.rotation, el.opacity, el.z_index, el.layer,
          el.payload_json,
          now, now,
        );
      }
    });
    tx();

    return this.buildPatch({
      upsertSlideIds: this.getSlideIdsForOwner(ownerColumn, ownerValue),
      upsertSlideElementIds: newElementIds,
    });
  }

  setSlideOrder(input: SlideOrderUpdateInput): SnapshotPatch {
    const now = nowIso();

    // Get the current slide to find its parent
    const slide = this.db
      .prepare('SELECT id, presentation_id, lyric_id FROM slides WHERE id = ?')
      .get(input.slideId) as { id: string; presentation_id: string | null; lyric_id: string | null } | undefined;

    if (!slide) return this.buildPatch({});

    // Determine parent column and value
    const isDecksSlide = slide.presentation_id !== null;
    const ownerColumn = isDecksSlide ? 'presentation_id' : 'lyric_id';
    const ownerId = isDecksSlide ? slide.presentation_id : slide.lyric_id;

    if (!ownerId) return this.buildPatch({});

    // Get all sibling slides sorted by current order_index
    const siblings = this.db
      .prepare(`SELECT id, order_index FROM slides WHERE ${ownerColumn} = ? ORDER BY order_index ASC`)
      .all(ownerId) as { id: string; order_index: number }[];

    // Find current position
    const currentIndex = siblings.findIndex(s => s.id === input.slideId);
    if (currentIndex === -1) return this.buildPatch({});

    // Clamp newOrder to valid range
    const maxOrder = siblings.length - 1;
    const targetOrder = Math.max(0, Math.min(input.newOrder, maxOrder));

    // No-op if already at target position
    if (currentIndex === targetOrder) return this.buildPatch({});

    // Reorder siblings by removing current and inserting at newOrder
    const reordered = siblings.filter((_, i) => i !== currentIndex);
    reordered.splice(targetOrder, 0, siblings[currentIndex]);

    // Update all siblings with new order_index values
    const tx = this.db.transaction(() => {
      reordered.forEach((sibling, index) => {
        this.db
          .prepare('UPDATE slides SET order_index = ?, updated_at = ? WHERE id = ?')
          .run(index, now, sibling.id);
      });
    });

    tx();
    // Every sibling's order_index (and updated_at) changed, so upsert all of them.
    return this.buildPatch({ upsertSlideIds: reordered.map((sibling) => sibling.id) });
  }

  setLibraryOrder(libraryId: Id, newOrder: number): SnapshotPatch {
    const now = nowIso();
    const siblings = this.db
      .prepare('SELECT id, order_index FROM libraries ORDER BY order_index ASC, created_at ASC')
      .all() as { id: string; order_index: number }[];

    const currentIndex = siblings.findIndex((s) => s.id === libraryId);
    if (currentIndex === -1) return this.buildPatch({});

    const maxOrder = siblings.length - 1;
    const targetOrder = Math.max(0, Math.min(newOrder, maxOrder));
    if (currentIndex === targetOrder) return this.buildPatch({});

    const reordered = siblings.filter((_, i) => i !== currentIndex);
    reordered.splice(targetOrder, 0, siblings[currentIndex]);

    const tx = this.db.transaction(() => {
      reordered.forEach((sibling, index) => {
        this.db
          .prepare('UPDATE libraries SET order_index = ?, updated_at = ? WHERE id = ?')
          .run(index, now, sibling.id);
      });
    });

    tx();
    return this.buildPatch({
      upsertLibraryIds: reordered.map((sibling) => sibling.id),
      replaceLibraryBundles: true,
    });
  }

  setPlaylistOrder(playlistId: Id, newOrder: number): SnapshotPatch {
    const now = nowIso();
    const current = this.db
      .prepare('SELECT id, library_id, order_index FROM playlists WHERE id = ?')
      .get(playlistId) as { id: string; library_id: string; order_index: number } | undefined;

    if (!current) return this.buildPatch({});

    const siblings = this.db
      .prepare('SELECT id, order_index FROM playlists WHERE library_id = ? ORDER BY order_index ASC')
      .all(current.library_id) as { id: string; order_index: number }[];

    const currentIndex = siblings.findIndex((s) => s.id === playlistId);
    if (currentIndex === -1) return this.buildPatch({});

    const maxOrder = siblings.length - 1;
    const targetOrder = Math.max(0, Math.min(newOrder, maxOrder));
    if (currentIndex === targetOrder) return this.buildPatch({});

    const reordered = siblings.filter((_, i) => i !== currentIndex);
    reordered.splice(targetOrder, 0, siblings[currentIndex]);

    const tx = this.db.transaction(() => {
      reordered.forEach((sibling, index) => {
        this.db
          .prepare('UPDATE playlists SET order_index = ?, updated_at = ? WHERE id = ?')
          .run(index, now, sibling.id);
      });
    });

    tx();
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  movePlaylistEntryTo(entryId: Id, segmentId: Id, newOrder: number): SnapshotPatch {
    const entry = this.db
      .prepare(
        `SELECT pe.id, pe.segment_id, ps.playlist_id
         FROM playlist_entries pe
         JOIN playlist_segments ps ON ps.id = pe.segment_id
         WHERE pe.id = ?`
      )
      .get(entryId) as { id: string; segment_id: string; playlist_id: string } | undefined;
    if (!entry) return this.buildPatch({});

    const targetSegment = this.db
      .prepare('SELECT id FROM playlist_segments WHERE id = ? AND playlist_id = ?')
      .get(segmentId, entry.playlist_id) as { id: string } | undefined;
    if (!targetSegment) return this.buildPatch({});

    const now = nowIso();
    const isSameSegment = entry.segment_id === segmentId;

    const tx = this.db.transaction(() => {
      if (isSameSegment) {
        const siblings = this.db
          .prepare('SELECT id FROM playlist_entries WHERE segment_id = ? ORDER BY order_index ASC')
          .all(segmentId) as { id: string }[];
        const currentIndex = siblings.findIndex((s) => s.id === entryId);
        if (currentIndex === -1) return;
        const maxOrder = siblings.length - 1;
        const targetOrder = Math.max(0, Math.min(newOrder, maxOrder));
        if (currentIndex === targetOrder) return;
        const reordered = siblings.filter((_, i) => i !== currentIndex);
        reordered.splice(targetOrder, 0, siblings[currentIndex]);
        reordered.forEach((sibling, index) => {
          this.db
            .prepare('UPDATE playlist_entries SET order_index = ?, updated_at = ? WHERE id = ?')
            .run(index, now, sibling.id);
        });
        return;
      }

      const targetSiblings = this.db
        .prepare('SELECT id FROM playlist_entries WHERE segment_id = ? ORDER BY order_index ASC')
        .all(segmentId) as { id: string }[];
      const clampedOrder = Math.max(0, Math.min(newOrder, targetSiblings.length));
      const newTargetList = [...targetSiblings];
      newTargetList.splice(clampedOrder, 0, { id: entryId });
      newTargetList.forEach((item, index) => {
        if (item.id === entryId) {
          this.db
            .prepare('UPDATE playlist_entries SET segment_id = ?, order_index = ?, updated_at = ? WHERE id = ?')
            .run(segmentId, index, now, item.id);
        } else {
          this.db
            .prepare('UPDATE playlist_entries SET order_index = ?, updated_at = ? WHERE id = ?')
            .run(index, now, item.id);
        }
      });

      const sourceSiblings = this.db
        .prepare('SELECT id FROM playlist_entries WHERE segment_id = ? ORDER BY order_index ASC')
        .all(entry.segment_id) as { id: string }[];
      sourceSiblings.forEach((sibling, index) => {
        this.db
          .prepare('UPDATE playlist_entries SET order_index = ?, updated_at = ? WHERE id = ?')
          .run(index, now, sibling.id);
      });
    });

    tx();
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  setPlaylistSegmentOrder(segmentId: Id, newOrder: number): SnapshotPatch {
    const now = nowIso();
    const current = this.db
      .prepare('SELECT id, playlist_id, order_index FROM playlist_segments WHERE id = ?')
      .get(segmentId) as { id: string; playlist_id: string; order_index: number } | undefined;

    if (!current) return this.buildPatch({});

    const siblings = this.db
      .prepare('SELECT id, order_index FROM playlist_segments WHERE playlist_id = ? ORDER BY order_index ASC')
      .all(current.playlist_id) as { id: string; order_index: number }[];

    const currentIndex = siblings.findIndex((s) => s.id === segmentId);
    if (currentIndex === -1) return this.buildPatch({});

    const maxOrder = siblings.length - 1;
    const targetOrder = Math.max(0, Math.min(newOrder, maxOrder));
    if (currentIndex === targetOrder) return this.buildPatch({});

    const reordered = siblings.filter((_, i) => i !== currentIndex);
    reordered.splice(targetOrder, 0, siblings[currentIndex]);

    const tx = this.db.transaction(() => {
      reordered.forEach((sibling, index) => {
        this.db
          .prepare('UPDATE playlist_segments SET order_index = ?, updated_at = ? WHERE id = ?')
          .run(index, now, sibling.id);
      });
    });

    tx();
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  createElement(input: ElementCreateInput): SnapshotPatch {
    const now = nowIso();
    const newId = input.id ?? createId();
    this.db
      .prepare(
        `INSERT INTO slide_elements
          (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        newId,
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
    return this.buildPatch({ upsertSlideElementIds: [newId] });
  }

  createElementsBatch(inputs: ElementCreateInput[]): SnapshotPatch {
    if (inputs.length === 0) return this.buildPatch({});
    const now = nowIso();
    const insert = this.db.prepare(
      `INSERT INTO slide_elements
        (id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const newIds: Id[] = [];
    const tx = this.db.transaction((batchInputs: ElementCreateInput[]) => {
      for (const input of batchInputs) {
        const newId = input.id ?? createId();
        newIds.push(newId);
        insert.run(
          newId,
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
    return this.buildPatch({ upsertSlideElementIds: newIds });
  }

  updateElement(input: ElementUpdateInput): SnapshotPatch {
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

    if (!existing) return this.buildPatch({});

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

    return this.buildPatch({ upsertSlideElementIds: [input.id] });
  }

  updateElementsBatch(inputs: ElementUpdateInput[]): SnapshotPatch {
    if (inputs.length === 0) return this.buildPatch({});
    const selectExisting = this.db.prepare('SELECT * FROM slide_elements WHERE id = ?');
    const update = this.db.prepare(
      `UPDATE slide_elements
       SET x = ?, y = ?, width = ?, height = ?, rotation = ?, opacity = ?, z_index = ?, layer = ?, payload_json = ?, updated_at = ?
       WHERE id = ?`
    );
    const updatedIds: Id[] = [];
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
        updatedIds.push(input.id);
      }
    });
    tx(inputs);
    return this.buildPatch({ upsertSlideElementIds: updatedIds });
  }

  deleteElement(id: Id): SnapshotPatch {
    this.db.prepare('DELETE FROM slide_elements WHERE id = ?').run(id);
    return this.buildPatch({ deletedSlideElementIds: [id] });
  }

  deleteElementsBatch(ids: Id[]): SnapshotPatch {
    if (ids.length === 0) return this.buildPatch({});
    const del = this.db.prepare('DELETE FROM slide_elements WHERE id = ?');
    const tx = this.db.transaction((batchIds: Id[]) => {
      for (const id of batchIds) del.run(id);
    });
    tx(ids);
    return this.buildPatch({ deletedSlideElementIds: [...ids] });
  }

  createMediaAsset(asset: MediaAssetCreateInput): SnapshotPatch {
    this.assertMediaSource(asset.src);
    const now = nowIso();
    const assetId = createId();
    const currentOrder =
      (this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM media_assets').get() as {
        maxOrder: number | null;
      }).maxOrder ?? -1;
    const collectionId = asset.collectionId ?? this.getMediaAssetDefaultCollectionId(asset.type);
    this.db
      .prepare(
        'INSERT INTO media_assets (id, name, type, src, collection_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(assetId, asset.name, asset.type, asset.src, collectionId, currentOrder + 1, now, now);
    return this.buildPatch({ upsertMediaAssetIds: [assetId] });
  }

  deleteMediaAsset(id: Id): SnapshotPatch {
    this.db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
    return this.buildPatch({ deletedMediaAssetIds: [id] });
  }

  updateMediaAssetSrc(id: Id, src: string): SnapshotPatch {
    this.assertMediaSource(src);
    this.db.prepare('UPDATE media_assets SET src = ?, updated_at = ? WHERE id = ?').run(src, nowIso(), id);
    return this.buildPatch({ upsertMediaAssetIds: [id] });
  }

  createOverlay(input: OverlayCreateInput): SnapshotPatch {
    const now = nowIso();
    const overlayId = createId();
    const elements = input.elements ?? [];
    const summary = summarizeOverlayElements(elements);
    const collectionId = input.collectionId ?? this.getDefaultCollectionId('overlay');
    this.db
      .prepare(
        `INSERT INTO overlays
         (id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, collection_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        overlayId,
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
        collectionId,
        now,
        now
      );

    return this.buildPatch({ upsertOverlayIds: [overlayId] });
  }

  updateOverlay(input: OverlayUpdateInput): SnapshotPatch {
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

    if (!existing) return this.buildPatch({});

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

    return this.buildPatch({ upsertOverlayIds: [input.id] });
  }

  renameLibrary(id: Id, name: string): SnapshotPatch {
    this.db
      .prepare('UPDATE libraries SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, nowIso(), id);
    return this.buildPatch({ upsertLibraryIds: [id], replaceLibraryBundles: true });
  }

  renamePlaylist(id: Id, name: string): SnapshotPatch {
    this.db
      .prepare('UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, nowIso(), id);
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  renamePresentation(id: Id, title: string): SnapshotPatch {
    this.db
      .prepare('UPDATE presentations SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, nowIso(), id);
    return this.buildPatch({ upsertPresentationIds: [id], replaceLibraryBundles: true });
  }

  renameLyric(id: Id, title: string): SnapshotPatch {
    this.db
      .prepare('UPDATE lyrics SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, nowIso(), id);
    return this.buildPatch({ upsertLyricIds: [id], replaceLibraryBundles: true });
  }

  deleteLibrary(id: Id): SnapshotPatch {
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
    return this.buildPatch({ deletedLibraryIds: [id], replaceLibraryBundles: true });
  }

  deletePlaylist(id: Id): SnapshotPatch {
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
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  deletePlaylistSegment(id: Id): SnapshotPatch {
    const tx = this.db.transaction((segmentId: Id) => {
      this.db
        .prepare('DELETE FROM playlist_entries WHERE segment_id = ?')
        .run(segmentId);
      this.db
        .prepare('DELETE FROM playlist_segments WHERE id = ?')
        .run(segmentId);
    });

    tx(id);
    return this.buildPatch({ replaceLibraryBundles: true });
  }

  deletePresentation(id: Id): SnapshotPatch {
    const deletedSlideIds = (this.db
      .prepare('SELECT id FROM slides WHERE presentation_id = ?')
      .all(id) as Array<{ id: string }>)
      .map((row) => row.id);
    const deletedSlideElementIds = this.getSlideElementIdsBySlideIds(deletedSlideIds);
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
    this.normalizeDeckItemOrder();
    const remainingPresentationIds = (this.db.prepare('SELECT id FROM presentations ORDER BY order_index ASC').all() as Array<{ id: string }>).map((row) => row.id);
    const remainingLyricIds = (this.db.prepare('SELECT id FROM lyrics ORDER BY order_index ASC').all() as Array<{ id: string }>).map((row) => row.id);
    return this.buildPatch({
      upsertPresentationIds: remainingPresentationIds,
      upsertLyricIds: remainingLyricIds,
      deletedPresentationIds: [id],
      deletedSlideIds,
      deletedSlideElementIds,
      replaceLibraryBundles: true,
    });
  }

  deleteLyric(id: Id): SnapshotPatch {
    const deletedSlideIds = (this.db
      .prepare('SELECT id FROM slides WHERE lyric_id = ?')
      .all(id) as Array<{ id: string }>)
      .map((row) => row.id);
    const deletedSlideElementIds = this.getSlideElementIdsBySlideIds(deletedSlideIds);
    const tx = this.db.transaction((lyricId: Id) => {
      this.db
        .prepare(
          `DELETE FROM slide_elements
           WHERE slide_id IN (SELECT id FROM slides WHERE lyric_id = ?)`
        )
        .run(lyricId);
      this.db
        .prepare('DELETE FROM slides WHERE lyric_id = ?')
        .run(lyricId);
      this.db
        .prepare('DELETE FROM playlist_entries WHERE lyric_id = ?')
        .run(lyricId);
      this.db
        .prepare('DELETE FROM lyrics WHERE id = ?')
        .run(lyricId);
    });

    tx(id);
    this.normalizeDeckItemOrder();
    const remainingPresentationIds = (this.db.prepare('SELECT id FROM presentations ORDER BY order_index ASC').all() as Array<{ id: string }>).map((row) => row.id);
    const remainingLyricIds = (this.db.prepare('SELECT id FROM lyrics ORDER BY order_index ASC').all() as Array<{ id: string }>).map((row) => row.id);
    return this.buildPatch({
      upsertPresentationIds: remainingPresentationIds,
      upsertLyricIds: remainingLyricIds,
      deletedLyricIds: [id],
      deletedSlideIds,
      deletedSlideElementIds,
      replaceLibraryBundles: true,
    });
  }

  setOverlayEnabled(overlayId: Id, enabled: boolean): SnapshotPatch {
    this.db
      .prepare('UPDATE overlays SET enabled = ?, updated_at = ? WHERE id = ?')
      .run(enabled ? 1 : 0, nowIso(), overlayId);
    return this.buildPatch({ upsertOverlayIds: [overlayId] });
  }

  deleteOverlay(overlayId: Id): SnapshotPatch {
    this.db.prepare('DELETE FROM overlays WHERE id = ?').run(overlayId);
    return this.buildPatch({ deletedOverlayIds: [overlayId] });
  }

  // ─── Stages ───────────────────────────────────────────────────────
  // A Stage is a named container of SlideElement[] that maps to its own NDI
  // sender. Schema mirrors templates (no kind, no template-application links).

  createStage(input: StageCreateInput): SnapshotPatch {
    const now = nowIso();
    const stageId = createId();
    const elements = input.elements ?? [];
    const width = input.width ?? 1920;
    const height = input.height ?? 1080;
    const nextOrderRow = this.db
      .prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM stages')
      .get() as { next_order: number };
    const collectionId = input.collectionId ?? this.getDefaultCollectionId('stage');

    this.db
      .prepare(
        `INSERT INTO stages (id, name, width, height, order_index, elements_json, collection_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        stageId,
        input.name,
        width,
        height,
        nextOrderRow.next_order,
        JSON.stringify(elements),
        collectionId,
        now,
        now,
      );

    return this.buildPatch({ upsertStageIds: [stageId] });
  }

  updateStage(input: StageUpdateInput): SnapshotPatch {
    const existing = this.db
      .prepare('SELECT id, name, width, height, order_index, elements_json FROM stages WHERE id = ?')
      .get(input.id) as
      | {
        id: string;
        name: string;
        width: number;
        height: number;
        order_index: number;
        elements_json: string;
      }
      | undefined;

    if (!existing) return this.buildPatch({});

    const nextElements = input.elements ?? parseJson<SlideElement[]>(existing.elements_json);

    this.db
      .prepare(
        `UPDATE stages
         SET name = ?, width = ?, height = ?, elements_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.name ?? existing.name,
        input.width ?? existing.width,
        input.height ?? existing.height,
        JSON.stringify(nextElements),
        nowIso(),
        input.id,
      );

    return this.buildPatch({ upsertStageIds: [input.id] });
  }

  deleteStage(stageId: Id): SnapshotPatch {
    this.db.prepare('DELETE FROM stages WHERE id = ?').run(stageId);
    return this.buildPatch({ deletedStageIds: [stageId] });
  }

  duplicateStage(stageId: Id): SnapshotPatch {
    const existing = this.db
      .prepare('SELECT id, name, width, height, elements_json, collection_id FROM stages WHERE id = ?')
      .get(stageId) as
      | { id: string; name: string; width: number; height: number; elements_json: string; collection_id: string }
      | undefined;

    if (!existing) return this.buildPatch({});

    const now = nowIso();
    const newId = createId();
    const nextOrderRow = this.db
      .prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM stages')
      .get() as { next_order: number };

    this.db
      .prepare(
        `INSERT INTO stages (id, name, width, height, order_index, elements_json, collection_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        newId,
        `${existing.name} copy`,
        existing.width,
        existing.height,
        nextOrderRow.next_order,
        existing.elements_json,
        existing.collection_id,
        now,
        now,
      );

    return this.buildPatch({ upsertStageIds: [newId] });
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

  private normalizeSlideOrder(ownerColumn: 'presentation_id' | 'lyric_id', ownerId: Id): void {
    const now = nowIso();
    this.db
      .prepare(
        `WITH ranked AS (
           SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC, created_at ASC, id ASC) - 1 AS next_order
           FROM slides
           WHERE ${ownerColumn} = ?
         )
         UPDATE slides
         SET order_index = (SELECT next_order FROM ranked WHERE ranked.id = slides.id),
             updated_at = ?
         WHERE ${ownerColumn} = ?`
      )
      .run(ownerId, now, ownerId);
  }

  private assertMediaSource(src: string): void {
    if (src.startsWith('blob:')) {
      throw new Error('Transient blob media sources are not allowed. Import from a local file path.');
    }
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

  private getDeckTableName(type: DeckItemType): 'presentations' | 'lyrics' {
    return type === 'presentation' ? 'presentations' : 'lyrics';
  }

  private getDeckOwnerColumn(type: DeckItemType): 'presentation_id' | 'lyric_id' {
    return type === 'presentation' ? 'presentation_id' : 'lyric_id';
  }

  private getMaxDeckOrder(): number {
    const row = this.db.prepare(
      `SELECT MAX(order_index) AS maxOrder
       FROM (
         SELECT order_index FROM presentations
         UNION ALL
         SELECT order_index FROM lyrics
       )`
    ).get() as { maxOrder: number | null };
    return row.maxOrder ?? -1;
  }

  private getOrderedContentReferences(): Array<{ id: Id; type: DeckItemType; order: number }> {
    return this.db.prepare(
      `SELECT id, type, order_index AS "order"
       FROM (
         SELECT id, 'presentation' AS type, order_index, created_at FROM presentations
         UNION ALL
         SELECT id, 'lyric' AS type, order_index, created_at FROM lyrics
       )
       ORDER BY order_index ASC, created_at ASC, id ASC`
    ).all() as Array<{ id: Id; type: DeckItemType; order: number }>;
  }

  private resolveDeckOwnerRow(id: Id): DeckOwnerRow | null {
    const deck = this.db
      .prepare('SELECT template_id FROM presentations WHERE id = ?')
      .get(id) as { template_id: string | null } | undefined;
    if (deck) {
      return { type: 'presentation', templateId: deck.template_id };
    }

    const lyric = this.db
      .prepare('SELECT template_id FROM lyrics WHERE id = ?')
      .get(id) as { template_id: string | null } | undefined;
    if (lyric) {
      return { type: 'lyric', templateId: lyric.template_id };
    }

    return null;
  }

  private resolveSlideOwnerInput(input: SlideCreateInput): (DeckOwnerRow & { id: Id }) | null {
    if (input.presentationId && input.lyricId) return null;
    const ownerId = input.presentationId ?? input.lyricId ?? null;
    if (!ownerId) return null;

    const owner = this.resolveDeckOwnerRow(ownerId);
    if (!owner) return null;

    if (owner.type === 'presentation' && input.presentationId) return { ...owner, id: input.presentationId };
    if (owner.type === 'lyric' && input.lyricId) return { ...owner, id: input.lyricId };
    return null;
  }

  private getDeckBundleItemById(itemId: Id): DeckBundleItem | null {
    const owner = this.resolveDeckOwnerRow(itemId);
    if (!owner) return null;

    const tableName = this.getDeckTableName(owner.type);
    const row = this.db
      .prepare(`SELECT id, title, template_id, order_index FROM ${tableName} WHERE id = ?`)
      .get(itemId) as { id: string; title: string; template_id: string | null; order_index: number } | undefined;

    if (!row) return null;

    const ownerColumn = this.getDeckOwnerColumn(owner.type);
    const slides = this.db
      .prepare(
        `SELECT id, width, height, notes, order_index
         FROM slides
         WHERE ${ownerColumn} = ?
         ORDER BY order_index ASC, created_at ASC`
      )
      .all(itemId) as Array<{ id: string; width: number; height: number; notes: string; order_index: number }>;

    const bundleSlides = slides.map((slide): DeckBundleSlide => ({
      id: slide.id,
      width: slide.width,
      height: slide.height,
      notes: slide.notes,
      order: slide.order_index,
      elements: this.getSlideElementsBySlideId(slide.id),
    }));

    return {
      id: row.id,
      type: owner.type,
      title: row.title,
      templateId: row.template_id,
      order: row.order_index,
      slides: bundleSlides,
    };
  }

  private getDeckBundleTemplateById(templateId: Id): DeckBundleTemplate | null {
    const row = this.db
      .prepare(
        `SELECT id, name, kind, width, height, order_index, elements_json
         FROM templates
         WHERE id = ?`
      )
      .get(templateId) as {
      id: string;
      name: string;
      kind: TemplateKind;
      width: number;
      height: number;
      order_index: number;
      elements_json: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      kind: this.normalizeTemplateKind(row.kind),
      width: row.width,
      height: row.height,
      order: row.order_index,
      elements: parseJson<SlideElement[]>(row.elements_json),
    };
  }

  // ─── Patch helpers (Stage 3 of perf plan) ─────────────────────────
  //
  // Build a SnapshotPatch from ids touched by a mutation. The resulting
  // patch carries just the rows that changed, not the entire snapshot.
  // Version is monotonically increasing for de-dup / ordering at the
  // renderer. See app/core/snapshot-patch.ts.

  private nextPatchVersion(): number {
    this.patchVersion += 1;
    return this.patchVersion;
  }

  private buildPatch(spec: {
    upsertLibraryIds?: Id[];
    upsertPresentationIds?: Id[];
    upsertLyricIds?: Id[];
    upsertSlideIds?: Id[];
    upsertSlideElementIds?: Id[];
    upsertMediaAssetIds?: Id[];
    upsertOverlayIds?: Id[];
    upsertTemplateIds?: Id[];
    upsertStageIds?: Id[];
    upsertCollectionIds?: Id[];
    deletedLibraryIds?: Id[];
    deletedPresentationIds?: Id[];
    deletedLyricIds?: Id[];
    deletedSlideIds?: Id[];
    deletedSlideElementIds?: Id[];
    deletedMediaAssetIds?: Id[];
    deletedOverlayIds?: Id[];
    deletedTemplateIds?: Id[];
    deletedStageIds?: Id[];
    deletedCollectionIds?: Id[];
    replaceLibraryBundles?: boolean;
  }): SnapshotPatch {
    const patch: SnapshotPatch = {
      version: this.nextPatchVersion(),
      upserts: {},
      deletes: {},
    };
    if (spec.upsertLibraryIds && spec.upsertLibraryIds.length > 0) {
      patch.upserts.libraries = this.getLibrariesByIds(spec.upsertLibraryIds);
    }
    if (spec.upsertPresentationIds && spec.upsertPresentationIds.length > 0) {
      patch.upserts.presentations = this.getPresentationsByIds(spec.upsertPresentationIds);
    }
    if (spec.upsertLyricIds && spec.upsertLyricIds.length > 0) {
      patch.upserts.lyrics = this.getLyricsByIds(spec.upsertLyricIds);
    }
    if (spec.upsertSlideIds && spec.upsertSlideIds.length > 0) {
      patch.upserts.slides = this.getSlidesByIds(spec.upsertSlideIds);
    }
    if (spec.upsertSlideElementIds && spec.upsertSlideElementIds.length > 0) {
      patch.upserts.slideElements = this.getSlideElementsByIds(spec.upsertSlideElementIds);
    }
    if (spec.upsertMediaAssetIds && spec.upsertMediaAssetIds.length > 0) {
      patch.upserts.mediaAssets = this.getMediaAssetsByIds(spec.upsertMediaAssetIds);
    }
    if (spec.upsertOverlayIds && spec.upsertOverlayIds.length > 0) {
      patch.upserts.overlays = this.getOverlaysByIds(spec.upsertOverlayIds);
    }
    if (spec.upsertTemplateIds && spec.upsertTemplateIds.length > 0) {
      patch.upserts.templates = this.getTemplatesByIds(spec.upsertTemplateIds);
    }
    if (spec.upsertStageIds && spec.upsertStageIds.length > 0) {
      patch.upserts.stages = this.getStagesByIds(spec.upsertStageIds);
    }
    if (spec.upsertCollectionIds && spec.upsertCollectionIds.length > 0) {
      patch.upserts.collections = this.getCollectionsByIds(spec.upsertCollectionIds);
    }
    if (spec.deletedLibraryIds && spec.deletedLibraryIds.length > 0) {
      patch.deletes.libraries = [...spec.deletedLibraryIds];
    }
    if (spec.deletedPresentationIds && spec.deletedPresentationIds.length > 0) {
      patch.deletes.presentations = [...spec.deletedPresentationIds];
    }
    if (spec.deletedLyricIds && spec.deletedLyricIds.length > 0) {
      patch.deletes.lyrics = [...spec.deletedLyricIds];
    }
    if (spec.deletedSlideIds && spec.deletedSlideIds.length > 0) {
      patch.deletes.slides = [...spec.deletedSlideIds];
    }
    if (spec.deletedSlideElementIds && spec.deletedSlideElementIds.length > 0) {
      patch.deletes.slideElements = [...spec.deletedSlideElementIds];
    }
    if (spec.deletedMediaAssetIds && spec.deletedMediaAssetIds.length > 0) {
      patch.deletes.mediaAssets = [...spec.deletedMediaAssetIds];
    }
    if (spec.deletedOverlayIds && spec.deletedOverlayIds.length > 0) {
      patch.deletes.overlays = [...spec.deletedOverlayIds];
    }
    if (spec.deletedTemplateIds && spec.deletedTemplateIds.length > 0) {
      patch.deletes.templates = [...spec.deletedTemplateIds];
    }
    if (spec.deletedStageIds && spec.deletedStageIds.length > 0) {
      patch.deletes.stages = [...spec.deletedStageIds];
    }
    if (spec.deletedCollectionIds && spec.deletedCollectionIds.length > 0) {
      patch.deletes.collections = [...spec.deletedCollectionIds];
    }
    if (spec.replaceLibraryBundles) {
      patch.upserts.libraryBundles = this.buildLibraryBundles();
    }
    return patch;
  }

  private buildLibraryBundles(): LibraryPlaylistBundle[] {
    const libraries = this.getLibraries();
    const presentations = this.getPresentations();
    const lyrics = this.getLyrics();
    const itemsById = new Map<Id, DeckItem>([
      ...presentations.map((deck) => [deck.id, deck] as const),
      ...lyrics.map((lyric) => [lyric.id, lyric] as const),
    ]);
    return libraries.map((library) => ({
      library,
      playlists: this.getPlaylistTreesByLibrary(library.id, itemsById),
    }));
  }

  private getLibrariesByIds(ids: Id[]): Library[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, name, order_index, created_at, updated_at
         FROM libraries
         WHERE id IN (${placeholders})
         ORDER BY order_index ASC, created_at ASC`
      )
      .all(...ids) as Array<{ id: string; name: string; order_index: number; created_at: string; updated_at: string }>;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getPresentationsByIds(ids: Id[]): Presentation[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, title, template_id, collection_id, order_index, created_at, updated_at
         FROM presentations
         WHERE id IN (${placeholders})
         ORDER BY order_index ASC, created_at ASC`
      )
      .all(...ids) as Array<{
      id: string;
      title: string;
      template_id: string | null;
      collection_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;
    return rows.map((row) => buildDeckItem({
      id: row.id,
      title: row.title,
      type: 'presentation',
      templateId: row.template_id,
      collectionId: row.collection_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) as Presentation[];
  }

  private getLyricsByIds(ids: Id[]): Lyric[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, title, template_id, collection_id, order_index, created_at, updated_at
         FROM lyrics
         WHERE id IN (${placeholders})
         ORDER BY order_index ASC, created_at ASC`
      )
      .all(...ids) as Array<{
      id: string;
      title: string;
      template_id: string | null;
      collection_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;
    return rows.map((row) => buildDeckItem({
      id: row.id,
      title: row.title,
      type: 'lyric',
      templateId: row.template_id,
      collectionId: row.collection_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) as Lyric[];
  }

  private getSlidesByIds(ids: Id[]): Slide[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT s.id, s.presentation_id, s.lyric_id, s.width, s.height, s.notes, s.order_index, s.created_at, s.updated_at,
                COALESCE(d.order_index, l.order_index) AS content_order
         FROM slides s
         LEFT JOIN presentations d ON d.id = s.presentation_id
         LEFT JOIN lyrics l ON l.id = s.lyric_id
         WHERE s.id IN (${placeholders})
         ORDER BY content_order ASC, s.order_index ASC`
      )
      .all(...ids) as Array<{
        id: string;
        presentation_id: string | null;
        lyric_id: string | null;
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
      lyricId: row.lyric_id,
      width: row.width,
      height: row.height,
      notes: row.notes,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getMediaAssetsByIds(ids: Id[]): MediaAsset[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, name, type, src, collection_id, order_index, created_at, updated_at
         FROM media_assets
         WHERE id IN (${placeholders})
         ORDER BY order_index ASC, created_at ASC, id ASC`
      )
      .all(...ids) as Array<{
      id: string;
      name: string;
      type: MediaAsset['type'];
      src: string;
      collection_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      src: row.src,
      collectionId: row.collection_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getOverlaysByIds(ids: Id[]): Overlay[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, collection_id, created_at, updated_at
         FROM overlays
         WHERE id IN (${placeholders})
         ORDER BY created_at ASC, id ASC`
      )
      .all(...ids) as Array<{
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
      collection_id: string;
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
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getTemplatesByIds(ids: Id[]): Template[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, name, kind, width, height, order_index, elements_json, collection_id, created_at, updated_at
         FROM templates
         WHERE id IN (${placeholders})
         ORDER BY order_index ASC, created_at ASC`
      )
      .all(...ids) as Array<{
      id: string;
      name: string;
      kind: string;
      width: number;
      height: number;
      order_index: number;
      elements_json: string;
      collection_id: string;
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
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getSlideElementsByIds(ids: Id[]): SlideElement[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at
         FROM slide_elements
         WHERE id IN (${placeholders})`
      )
      .all(...ids) as Array<{
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
      updatedAt: row.updated_at,
    }));
  }

  private getSlideElementsBySlideId(slideId: Id): SlideElement[] {
    const rows = this.db
      .prepare(
        `SELECT id, slide_id, type, x, y, width, height, rotation, opacity, z_index, layer, payload_json, created_at, updated_at
         FROM slide_elements
         WHERE slide_id = ?
         ORDER BY layer ASC, z_index ASC, created_at ASC`
      )
      .all(slideId) as Array<{
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
      updatedAt: row.updated_at,
    }));
  }

  private getSlideIdsForOwner(ownerColumn: 'presentation_id' | 'lyric_id', ownerId: Id): Id[] {
    return (this.db
      .prepare(`SELECT id FROM slides WHERE ${ownerColumn} = ? ORDER BY order_index ASC`)
      .all(ownerId) as Array<{ id: string }>)
      .map((row) => row.id);
  }

  private getSlideElementIdsBySlideIds(slideIds: Id[]): Id[] {
    if (slideIds.length === 0) return [];
    const placeholders = slideIds.map(() => '?').join(',');
    return (this.db
      .prepare(`SELECT id FROM slide_elements WHERE slide_id IN (${placeholders}) ORDER BY created_at ASC, id ASC`)
      .all(...slideIds) as Array<{ id: string }>)
      .map((row) => row.id);
  }

  private assertValidDeckBundleManifest(manifest: DeckBundleManifest): void {
    if (!manifest || manifest.format !== 'cast-deck-bundle' || manifest.version !== 1) {
      throw new Error('Unsupported bundle format.');
    }

    if (!Array.isArray(manifest.items) || !Array.isArray(manifest.templates)) {
      throw new Error('Invalid bundle manifest.');
    }

    const templateIds = new Set<Id>();
    for (const template of manifest.templates) {
      if (!template?.id || !template.name) throw new Error('Invalid bundle template.');
      if (template.kind !== 'slides' && template.kind !== 'lyrics' && template.kind !== 'overlays') {
        throw new Error(`Unknown template kind: ${template.kind}`);
      }
      templateIds.add(template.id);
    }

    for (const item of manifest.items) {
      if (!item?.id || !item.title) throw new Error('Invalid bundle item.');
      if (item.type !== 'presentation' && item.type !== 'lyric') {
        throw new Error(`Unknown content item type: ${item.type}`);
      }
      if (item.templateId && !templateIds.has(item.templateId)) {
        throw new Error(`Bundle item ${item.title} references a missing template.`);
      }
      if (item.templateId) {
        const template = manifest.templates.find((entry) => entry.id === item.templateId) ?? null;
        if (!template || !isTemplateCompatibleWithDeckItem(template as Template, item.type)) {
          throw new Error(`Bundle item ${item.title} has an incompatible template.`);
        }
      }
      for (const slide of item.slides) {
        if (!slide?.id || !Array.isArray(slide.elements)) {
          throw new Error(`Invalid slide in ${item.title}.`);
        }
      }
    }

    if (manifest.overlays !== undefined) {
      if (!Array.isArray(manifest.overlays)) throw new Error('Invalid bundle overlays.');
      for (const overlay of manifest.overlays) {
        if (!overlay?.id || !overlay.name || !Array.isArray(overlay.elements)) {
          throw new Error('Invalid bundle overlay.');
        }
      }
    }

    if (manifest.stages !== undefined) {
      if (!Array.isArray(manifest.stages)) throw new Error('Invalid bundle stages.');
      for (const stage of manifest.stages) {
        if (!stage?.id || !stage.name || !Array.isArray(stage.elements)) {
          throw new Error('Invalid bundle stage.');
        }
      }
    }
  }

  private collectBrokenBundleReferences(manifest: DeckBundleManifest): BrokenDeckBundleReference[] {
    const references = new Map<string, BrokenReferenceAccumulator>();

    function collect(
      elements: SlideElement[],
      owner: { itemTitle?: string; templateName?: string; overlayName?: string; stageName?: string },
    ) {
      for (const element of elements) {
        const reference = readElementMediaReference(element);
        if (!reference || !isBrokenMediaSource(reference.source)) continue;
        const current = references.get(reference.source) ?? {
          elementTypes: new Set<'image' | 'video'>(),
          occurrenceCount: 0,
          itemTitles: new Set<string>(),
          templateNames: new Set<string>(),
          overlayNames: new Set<string>(),
          stageNames: new Set<string>(),
        };
        current.elementTypes.add(reference.elementType);
        current.occurrenceCount += 1;
        if (owner.itemTitle) current.itemTitles.add(owner.itemTitle);
        if (owner.templateName) current.templateNames.add(owner.templateName);
        if (owner.overlayName) current.overlayNames.add(owner.overlayName);
        if (owner.stageName) current.stageNames.add(owner.stageName);
        references.set(reference.source, current);
      }
    }

    for (const item of manifest.items) {
      for (const slide of item.slides) {
        collect(slide.elements, { itemTitle: item.title });
      }
    }

    for (const template of manifest.templates) {
      collect(template.elements, { templateName: template.name });
    }

    for (const overlay of manifest.overlays ?? []) {
      collect(overlay.elements, { overlayName: overlay.name });
    }

    for (const stage of manifest.stages ?? []) {
      collect(stage.elements, { stageName: stage.name });
    }

    return Array.from(references.entries())
      .map(([source, reference]) => ({
        source,
        elementTypes: Array.from(reference.elementTypes).sort(),
        occurrenceCount: reference.occurrenceCount,
        itemTitles: Array.from(reference.itemTitles).sort(),
        templateNames: Array.from(reference.templateNames).sort(),
        overlayNames: Array.from(reference.overlayNames).sort(),
        stageNames: Array.from(reference.stageNames).sort(),
      }))
      .sort((left, right) => left.source.localeCompare(right.source));
  }

  private applyBrokenReferenceDecisions(
    manifest: DeckBundleManifest,
    decisionMap: ReadonlyMap<string, DeckBundleBrokenReferenceDecision>,
  ): void {
    function rewriteElements(
      elements: SlideElement[],
      localDecisionMap: ReadonlyMap<string, DeckBundleBrokenReferenceDecision>,
    ): SlideElement[] {
      return elements.flatMap((element) => {
        const reference = readElementMediaReference(element);
        if (!reference || !isBrokenMediaSource(reference.source)) return [element];
        const decision = localDecisionMap.get(reference.source);
        if (!decision || decision.action === 'leave') return [element];
        if (decision.action === 'remove') return [];
        const nextSrc = toCastMediaSource(decision.replacementPath ?? '');
        if (!nextSrc) {
          throw new Error(`Invalid replacement path for ${reference.source}`);
        }
        return [{
          ...element,
          payload: {
            ...element.payload,
            src: nextSrc,
          },
        }];
      });
    }

    manifest.items = manifest.items.map((item) => ({
      ...item,
      slides: item.slides.map((slide) => ({
        ...slide,
        elements: rewriteElements(slide.elements, decisionMap),
      })),
    }));
    manifest.templates = manifest.templates.map((template) => ({
      ...template,
      elements: rewriteElements(template.elements, decisionMap),
    }));
    if (manifest.overlays) {
      manifest.overlays = manifest.overlays.map((overlay) => ({
        ...overlay,
        elements: rewriteElements(overlay.elements, decisionMap),
      }));
    }
    if (manifest.stages) {
      manifest.stages = manifest.stages.map((stage) => ({
        ...stage,
        elements: rewriteElements(stage.elements, decisionMap),
      }));
    }
    manifest.mediaReferences = collectDeckBundleMediaReferences(
      manifest.items,
      manifest.templates,
      manifest.overlays ?? [],
      manifest.stages ?? [],
    );
  }

  private collectReplacementMediaSources(
    brokenReferences: BrokenDeckBundleReference[],
    decisionMap: ReadonlyMap<string, DeckBundleBrokenReferenceDecision>,
  ): Array<{ rawPath: string; src: string; elementTypes: Array<'image' | 'video'> }> {
    return brokenReferences.flatMap((reference) => {
      const decision = decisionMap.get(reference.source);
      if (!decision || decision.action !== 'replace' || !decision.replacementPath) return [];
      const normalizedSrc = toCastMediaSource(decision.replacementPath);
      if (!normalizedSrc) {
        throw new Error(`Invalid replacement path for ${reference.source}`);
      }
      return [{
        rawPath: decision.replacementPath,
        src: normalizedSrc,
        elementTypes: reference.elementTypes,
      }];
    });
  }

  private inferImportedMediaAssetType(
    elementTypes: Array<'image' | 'video'>,
    src: string,
  ): MediaAsset['type'] {
    const extension = path.extname(src).toLowerCase();
    if (extension === '.mp4' || extension === '.mov' || extension === '.webm' || extension === '.m4v') {
      return 'video';
    }
    if (elementTypes.includes('video') && !elementTypes.includes('image')) return 'video';
    return 'image';
  }

  private createImportedTemplateElement(
    element: SlideElement,
    templateId: Id,
    now: string,
    elementIndex: number,
  ): SlideElement {
    return {
      ...JSON.parse(JSON.stringify(element)) as SlideElement,
      id: `${templateId}:template:${elementIndex}`,
      slideId: templateId,
      createdAt: now,
      updatedAt: now,
    };
  }

  private createImportedSlideElement(
    element: SlideElement,
    slideId: Id,
    now: string,
    elementIndex: number,
  ): SlideElement {
    return {
      ...JSON.parse(JSON.stringify(element)) as SlideElement,
      id: `${slideId}:element:${elementIndex}`,
      slideId,
      createdAt: now,
      updatedAt: now,
    };
  }

  private getNextTemplateOrderIndex(): number {
    const row = this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM templates').get() as { maxOrder: number | null };
    return (row.maxOrder ?? -1) + 1;
  }

  private getNextMediaAssetOrderIndex(): number {
    const row = this.db.prepare('SELECT MAX(order_index) AS maxOrder FROM media_assets').get() as { maxOrder: number | null };
    return (row.maxOrder ?? -1) + 1;
  }

  private getLibraries(): Library[] {
    const rows = this.db
      .prepare('SELECT id, name, order_index, created_at, updated_at FROM libraries ORDER BY order_index ASC, created_at ASC')
      .all() as Array<{ id: string; name: string; order_index: number; created_at: string; updated_at: string }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPresentations(): Presentation[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, template_id, collection_id, order_index, created_at, updated_at FROM presentations ORDER BY order_index ASC, created_at ASC'
      )
      .all() as Array<{
      id: string;
      title: string;
      template_id: string | null;
      collection_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => buildDeckItem({
      id: row.id,
      title: row.title,
      type: 'presentation',
      templateId: row.template_id,
      collectionId: row.collection_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as Presentation[];
  }

  private getLyrics(): Lyric[] {
    const rows = this.db
      .prepare(
        'SELECT id, title, template_id, collection_id, order_index, created_at, updated_at FROM lyrics ORDER BY order_index ASC, created_at ASC'
      )
      .all() as Array<{
      id: string;
      title: string;
      template_id: string | null;
      collection_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => buildDeckItem({
      id: row.id,
      title: row.title,
      type: 'lyric',
      templateId: row.template_id,
      collectionId: row.collection_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as Lyric[];
  }

  private getSlides(): Slide[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.presentation_id, s.lyric_id, s.width, s.height, s.notes, s.order_index, s.created_at, s.updated_at,
                COALESCE(d.order_index, l.order_index) AS content_order
         FROM slides s
         LEFT JOIN presentations d ON d.id = s.presentation_id
         LEFT JOIN lyrics l ON l.id = s.lyric_id
         WHERE s.presentation_id IS NOT NULL OR s.lyric_id IS NOT NULL
         ORDER BY content_order ASC, s.order_index ASC`
      )
      .all() as Array<{
      id: string;
      presentation_id: string | null;
      lyric_id: string | null;
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
      lyricId: row.lyric_id,
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
         LEFT JOIN presentations d ON d.id = s.presentation_id
         LEFT JOIN lyrics l ON l.id = s.lyric_id
         ORDER BY COALESCE(d.order_index, l.order_index) ASC, s.order_index ASC, se.layer ASC, se.z_index ASC`
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
      .prepare(
        'SELECT id, library_id, name, order_index, created_at, updated_at FROM playlists WHERE library_id = ? ORDER BY order_index ASC, created_at ASC'
      )
      .all(libraryId) as Array<{
      id: string;
      library_id: string;
      name: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      libraryId: row.library_id,
      name: row.name,
      order: row.order_index,
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
        'SELECT id, segment_id, presentation_id, lyric_id, order_index, created_at, updated_at FROM playlist_entries WHERE segment_id = ? ORDER BY order_index ASC'
      )
      .all(segmentId) as Array<{
      id: string;
      segment_id: string;
      presentation_id: string | null;
      lyric_id: string | null;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      segmentId: row.segment_id,
      presentationId: row.presentation_id,
      lyricId: row.lyric_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getPlaylistTreesByLibrary(libraryId: Id, itemsById: ReadonlyMap<Id, DeckItem>): PlaylistTree[] {
    return this.getPlaylistsByLibrary(libraryId).map((playlist) => {
      const segments = this.getPlaylistSegments(playlist.id).map((segment) => {
        const entries = this.getPlaylistEntries(segment.id)
          .map((entry) => {
            const itemId = entry.presentationId ?? entry.lyricId;
            if (!itemId) return null;
            const item = itemsById.get(itemId);
            if (!item) return null;
            return { entry, item };
          })
          .filter((value): value is { entry: PlaylistEntry; item: DeckItem } => value !== null);

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
        'SELECT id, name, type, src, collection_id, order_index, created_at, updated_at FROM media_assets ORDER BY order_index ASC, created_at ASC, id ASC'
      )
      .all() as Array<{
      id: string;
      name: string;
      type: MediaAsset['type'];
      src: string;
      collection_id: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      src: row.src,
      collectionId: row.collection_id,
      order: row.order_index,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getOverlays(): Overlay[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, type, x, y, width, height, opacity, z_index, enabled, payload_json, elements_json, animation_json, collection_id, created_at, updated_at
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
      collection_id: string;
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
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private getTemplates(): Template[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, kind, width, height, order_index, elements_json, collection_id, created_at, updated_at
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
      collection_id: string;
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
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getStages(): Stage[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, width, height, order_index, elements_json, collection_id, created_at, updated_at
         FROM stages
         ORDER BY order_index ASC, created_at ASC`
      )
      .all() as Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      order_index: number;
      elements_json: string;
      collection_id: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      order: row.order_index,
      elements: parseJson<SlideElement[]>(row.elements_json),
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getStagesByIds(ids: Id[]): Stage[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, name, width, height, order_index, elements_json, collection_id, created_at, updated_at
         FROM stages
         WHERE id IN (${placeholders})
         ORDER BY order_index ASC, created_at ASC`
      )
      .all(...ids) as Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      order_index: number;
      elements_json: string;
      collection_id: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      order: row.order_index,
      elements: parseJson<SlideElement[]>(row.elements_json),
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private getTemplateById(templateId: Id): Template | null {
    const row = this.db
      .prepare(
        `SELECT id, name, kind, width, height, order_index, elements_json, collection_id, created_at, updated_at
         FROM templates
         WHERE id = ?`
      )
      .get(templateId) as {
        id: string;
        name: string;
        kind: string;
        width: number;
        height: number;
        order_index: number;
        elements_json: string;
        collection_id: string;
        created_at: string;
        updated_at: string;
      } | undefined;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      kind: this.normalizeTemplateKind(row.kind),
      width: row.width,
      height: row.height,
      order: row.order_index,
      elements: parseJson<SlideElement[]>(row.elements_json),
      collectionId: row.collection_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
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

  private normalizeDeckItemOrder(): void {
    const orderedItems = this.getOrderedContentReferences();
    const now = nowIso();
    const tx = this.db.transaction(() => {
      orderedItems.forEach((item, index) => {
        this.db
          .prepare(`UPDATE ${this.getDeckTableName(item.type)} SET order_index = ?, updated_at = ? WHERE id = ?`)
          .run(index, now, item.id);
      });
    });
    tx();
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
