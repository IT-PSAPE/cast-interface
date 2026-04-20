import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeRepository, createTempUserDataPath } from './store-test-support';
import type { CastRepository } from './store';

let currentUserDataPath = '';

vi.mock('electron', () => ({
  app: {
    getPath: () => currentUserDataPath,
  },
}));

describe('CastRepository patch mutations', () => {
  let repository!: CastRepository;

  beforeEach(async () => {
    currentUserDataPath = createTempUserDataPath();
    const storeModule = await import('./store');
    repository = new storeModule.CastRepository();
  });

  afterEach(() => {
    closeRepository(repository);
    fs.rmSync(currentUserDataPath, { recursive: true, force: true });
    currentUserDataPath = '';
  });

  it('createSlide returns the new lyric slide and its initial text element', () => {
    const lyricPatch = repository.createLyric('Song A');
    const lyricId = lyricPatch.upserts.lyrics?.[0]?.id;

    expect(lyricId).toBeTruthy();

    const patch = repository.createSlide({ lyricId });

    expect(patch.upserts.slides).toHaveLength(1);
    expect(patch.upserts.slideElements).toHaveLength(1);
    expect(patch.upserts.slideElements?.[0]?.slideId).toBe(patch.upserts.slides?.[0]?.id);
  });

  it('deleteSlide returns explicit child deletions and reordered sibling slides', () => {
    const presentationId = repository.getSnapshot().presentations[0]?.id;

    expect(presentationId).toBeTruthy();

    const firstCreatedSlideId = repository.createSlide({ presentationId }).upserts.slides?.[0]?.id;
    const secondCreatedSlideId = repository.createSlide({ presentationId }).upserts.slides?.[0]?.id;

    expect(firstCreatedSlideId).toBeTruthy();
    expect(secondCreatedSlideId).toBeTruthy();

    const patch = repository.deleteSlide(firstCreatedSlideId as string);

    expect(patch.deletes.slides).toContain(firstCreatedSlideId);
    expect(patch.upserts.slides?.some((slide) => slide.id === secondCreatedSlideId)).toBe(true);
    expect(repository.getSnapshot().slides
      .filter((slide) => slide.presentationId === presentationId)
      .map((slide) => slide.order))
      .toEqual([0, 1]);
  });

  it('createLibrary upserts the new library and replaces libraryBundles', () => {
    const patch = repository.createLibrary('Events');

    expect(patch.upserts.libraries).toHaveLength(1);
    expect(patch.upserts.libraries?.[0]?.name).toBe('Events');
    expect(patch.upserts.libraryBundles?.some((bundle) => bundle.library.name === 'Events')).toBe(true);
  });

  it('createMediaAsset and createOverlay return targeted top-level upserts', () => {
    const mediaPatch = repository.createMediaAsset({
      name: 'Countdown',
      type: 'video',
      src: '/tmp/countdown.mp4',
    });
    const overlayPatch = repository.createOverlay({ name: 'Lower Third' });

    expect(mediaPatch.upserts.mediaAssets).toHaveLength(1);
    expect(mediaPatch.upserts.mediaAssets?.[0]?.name).toBe('Countdown');
    expect(overlayPatch.upserts.overlays).toHaveLength(1);
    expect(overlayPatch.upserts.overlays?.[0]?.name).toBe('Lower Third');
  });

  it('applyTemplateToDeckItem upserts the owner, slide elements, and rebuilt libraryBundles', () => {
    const presentationId = repository.getSnapshot().presentations[0]?.id;
    const templatePatch = repository.createTemplate({ name: 'Slides Template', kind: 'slides' });
    const templateId = templatePatch.upserts.templates?.[0]?.id;

    expect(presentationId).toBeTruthy();
    expect(templateId).toBeTruthy();

    const patch = repository.applyTemplateToDeckItem(templateId as string, presentationId as string);

    expect(patch.upserts.presentations?.[0]?.id).toBe(presentationId);
    expect(patch.upserts.slideElements?.length).toBeGreaterThan(0);
    expect(patch.upserts.libraryBundles).toBeDefined();
    expect(repository.getSnapshot().presentations[0]?.templateId).toBe(templateId);
  });
});
