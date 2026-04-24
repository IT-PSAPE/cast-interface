import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlideElement } from '@core/types';
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

  it('applyTemplateToDeckItem deletes stale slide elements from the patch', () => {
    const lyricId = repository.createLyric('Song B').upserts.lyrics?.[0]?.id;
    expect(lyricId).toBeTruthy();

    const slideId = repository.createSlide({ lyricId }).upserts.slides?.[0]?.id;
    expect(slideId).toBeTruthy();

    const imageId = repository.createElement({
      slideId: slideId as string,
      type: 'image',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      zIndex: 1,
      layer: 'background',
      payload: { src: '/tmp/old-background.jpg' },
    }).upserts.slideElements?.[0]?.id;
    expect(imageId).toBeTruthy();

    const templateElement: SlideElement = {
      id: 'template-text',
      slideId: 'template-owner',
      type: 'text',
      x: 120,
      y: 120,
      width: 1680,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      layer: 'content',
      payload: {
        text: 'Template line',
        fontFamily: 'Avenir Next',
        fontSize: 72,
        color: '#ffffff',
        alignment: 'center',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const templateId = repository.createTemplate({ name: 'Clear Lyrics', kind: 'lyrics', elements: [templateElement] }).upserts.templates?.[0]?.id;
    expect(templateId).toBeTruthy();

    const patch = repository.applyTemplateToDeckItem(templateId as string, lyricId as string);

    expect(patch.deletes.slideElements).toContain(imageId);
    expect(repository.getSnapshot().slideElements.some((element) => element.id === imageId)).toBe(false);
  });
});
