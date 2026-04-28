import type { AppSnapshot, Id, LibraryPlaylistBundle, Library, Lyric, MediaAsset, Overlay, Presentation, Slide, SlideElement, Stage, Template } from './types';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Differential update to an AppSnapshot. Emitted by the main process on
 * mutations and applied on the renderer to update local state without
 * paying the IPC cost of a full AppSnapshot round-trip.
 *
 * The `version` field is a monotonically-increasing counter bumped on
 * every mutation; downstream code can use it for ordering / de-dup, or
 * just as a debug hint.
 *
 * Each top-level table present in `upserts` or `deletes` mutates the
 * corresponding array in AppSnapshot. Missing keys mean "no change".
 * Upserts carry full records; deletes carry just the ids.
 *
 * `libraryBundles` is a derived structure. When it appears in a patch
 * it is a full replacement (rebuilt main-side from the underlying
 * libraries/playlists/segments/entries).
 */
export interface SnapshotPatch {
  version: number;
  upserts: {
    libraries?: Library[];
    presentations?: Presentation[];
    lyrics?: Lyric[];
    slides?: Slide[];
    slideElements?: SlideElement[];
    mediaAssets?: MediaAsset[];
    overlays?: Overlay[];
    templates?: Template[];
    stages?: Stage[];
    libraryBundles?: LibraryPlaylistBundle[];
  };
  deletes: {
    libraries?: Id[];
    presentations?: Id[];
    lyrics?: Id[];
    slides?: Id[];
    slideElements?: Id[];
    mediaAssets?: Id[];
    overlays?: Id[];
    templates?: Id[];
    stages?: Id[];
  };
}

// ─── Utilities ──────────────────────────────────────────────────────

export function createEmptyPatch(version: number): SnapshotPatch {
  return { version, upserts: {}, deletes: {} };
}

/**
 * Apply a patch to an AppSnapshot, returning a new AppSnapshot.
 * Arrays are never mutated in place — a fresh AppSnapshot and fresh
 * arrays are produced for every changed key, so React consumers can
 * rely on reference-equality for change detection.
 */
export function applyPatch(snapshot: AppSnapshot, patch: SnapshotPatch): AppSnapshot {
  const next: AppSnapshot = {
    ...snapshot,
    libraries: mergeTable(snapshot.libraries, patch.upserts.libraries, patch.deletes.libraries),
    presentations: mergeTable(snapshot.presentations, patch.upserts.presentations, patch.deletes.presentations),
    lyrics: mergeTable(snapshot.lyrics, patch.upserts.lyrics, patch.deletes.lyrics),
    slides: mergeTable(snapshot.slides, patch.upserts.slides, patch.deletes.slides),
    slideElements: mergeTable(snapshot.slideElements, patch.upserts.slideElements, patch.deletes.slideElements),
    mediaAssets: mergeTable(snapshot.mediaAssets, patch.upserts.mediaAssets, patch.deletes.mediaAssets),
    overlays: mergeTable(snapshot.overlays, patch.upserts.overlays, patch.deletes.overlays),
    templates: mergeTable(snapshot.templates, patch.upserts.templates, patch.deletes.templates),
    stages: mergeTable(snapshot.stages, patch.upserts.stages, patch.deletes.stages),
    libraryBundles: patch.upserts.libraryBundles ?? snapshot.libraryBundles,
  };
  return next;
}

function mergeTable<T extends { id: Id }>(current: T[], upserts: T[] | undefined, deletes: Id[] | undefined): T[] {
  if (!upserts && !deletes) return current;
  const deletedIds = deletes && deletes.length > 0 ? new Set(deletes) : null;
  const upsertsById = upserts && upserts.length > 0
    ? new Map(upserts.map((record) => [record.id, record] as const))
    : null;

  const next: T[] = [];
  const seenUpserts = upsertsById ? new Set<Id>() : null;

  for (const record of current) {
    if (deletedIds?.has(record.id)) continue;
    const replacement = upsertsById?.get(record.id);
    if (replacement) {
      next.push(replacement);
      seenUpserts?.add(record.id);
    } else {
      next.push(record);
    }
  }

  if (upsertsById) {
    for (const [id, record] of upsertsById) {
      if (!seenUpserts?.has(id)) next.push(record);
    }
  }

  return next;
}

export function isSnapshotPatch(value: unknown): value is SnapshotPatch {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as SnapshotPatch;
  return typeof candidate.version === 'number'
    && typeof candidate.upserts === 'object'
    && typeof candidate.deletes === 'object';
}
