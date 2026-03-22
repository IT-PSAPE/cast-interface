import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentBundleManifest } from '@core/types';
import { closeRepository, createTempUserDataPath } from './store-test-support';

const electronState = vi.hoisted(() => ({ userDataPath: '' }));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => electronState.userDataPath),
  },
}));

import { CastRepository } from './store';

function toCastMediaSource(filePath: string): string {
  return `cast-media://${encodeURIComponent(filePath)}`;
}

describe('CastRepository content bundles', () => {
  let userDataPath = '';

  afterEach(() => {
    if (userDataPath) {
      fs.rmSync(userDataPath, { recursive: true, force: true });
      userDataPath = '';
    }
  });

  it('exports selected content with referenced templates and media inventory', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;
    const repository = new CastRepository();

    const existingImagePath = path.join(userDataPath, 'bundle-image.png');
    fs.writeFileSync(existingImagePath, 'image');

    let snapshot = repository.createTemplate({ name: 'Bundle Template', kind: 'slides' });
    const template = snapshot.templates.find((entry) => entry.name === 'Bundle Template');
    expect(template).toBeTruthy();

    snapshot = repository.createDeck('Bundle Deck');
    snapshot = repository.createLyric('Unrelated Lyric');
    const deck = snapshot.decks.find((entry) => entry.title === 'Bundle Deck');
    expect(deck).toBeTruthy();

    snapshot = repository.applyTemplateToContentItem(template!.id, deck!.id);
    snapshot = repository.createSlide({ deckId: deck!.id });
    const deckSlides = snapshot.slides.filter((slide) => slide.deckId === deck!.id);
    const slide = deckSlides.at(-1);
    expect(slide).toBeTruthy();

    snapshot = repository.createElement({
      slideId: slide!.id,
      type: 'image',
      x: 80,
      y: 80,
      width: 640,
      height: 360,
      payload: { src: toCastMediaSource(existingImagePath) },
    });

    const manifest = repository.exportContentBundle([deck!.id]);
    closeRepository(repository);

    expect(manifest.items).toHaveLength(1);
    expect(manifest.items[0].title).toBe('Bundle Deck');
    expect(manifest.templates).toHaveLength(1);
    expect(manifest.templates[0].id).toBe(template!.id);
    expect(manifest.mediaReferences).toEqual([
      {
        source: toCastMediaSource(existingImagePath),
        elementTypes: ['image'],
        occurrenceCount: 1,
      },
    ]);
  });

  it('imports bundles with replace and remove decisions applied before persistence', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;
    const repository = new CastRepository();

    const replacementPath = path.join(userDataPath, 'replacement-image.png');
    fs.writeFileSync(replacementPath, 'image');
    const brokenImageSource = toCastMediaSource(path.join(userDataPath, 'missing-image.png'));
    const brokenVideoSource = toCastMediaSource(path.join(userDataPath, 'missing-video.mp4'));

    const manifest: ContentBundleManifest = {
      format: 'cast-content-bundle',
      version: 1,
      exportedAt: '2026-03-22T10:00:00.000Z',
      items: [
        {
          id: 'bundle-deck',
          type: 'deck',
          title: 'Imported Bundle Deck',
          templateId: 'bundle-template',
          order: 0,
          slides: [
            {
              id: 'bundle-slide-1',
              width: 1920,
              height: 1080,
              notes: '',
              order: 0,
              elements: [
                {
                  id: 'bundle-slide-image-1',
                  slideId: 'bundle-slide-1',
                  type: 'image',
                  x: 100,
                  y: 100,
                  width: 400,
                  height: 300,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 1,
                  layer: 'media',
                  payload: { src: brokenImageSource },
                  createdAt: '',
                  updatedAt: '',
                },
                {
                  id: 'bundle-slide-image-2',
                  slideId: 'bundle-slide-1',
                  type: 'image',
                  x: 540,
                  y: 100,
                  width: 400,
                  height: 300,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  layer: 'media',
                  payload: { src: brokenImageSource },
                  createdAt: '',
                  updatedAt: '',
                },
                {
                  id: 'bundle-slide-video-1',
                  slideId: 'bundle-slide-1',
                  type: 'video',
                  x: 100,
                  y: 460,
                  width: 640,
                  height: 360,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 3,
                  layer: 'media',
                  payload: { src: brokenVideoSource, autoplay: true, loop: true, muted: true },
                  createdAt: '',
                  updatedAt: '',
                },
              ],
            },
          ],
        },
      ],
      templates: [
        {
          id: 'bundle-template',
          name: 'Imported Bundle Template',
          kind: 'slides',
          width: 1920,
          height: 1080,
          order: 0,
          elements: [
            {
              id: 'bundle-template-image',
              slideId: 'bundle-template',
              type: 'image',
              x: 0,
              y: 0,
              width: 1920,
              height: 1080,
              rotation: 0,
              opacity: 1,
              zIndex: 0,
              layer: 'media',
              payload: { src: brokenImageSource },
              createdAt: '',
              updatedAt: '',
            },
            {
              id: 'bundle-template-video',
              slideId: 'bundle-template',
              type: 'video',
              x: 0,
              y: 0,
              width: 800,
              height: 450,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              layer: 'media',
              payload: { src: brokenVideoSource, autoplay: false, loop: true, muted: true },
              createdAt: '',
              updatedAt: '',
            },
          ],
        },
      ],
      mediaReferences: [],
    };

    const inspection = repository.inspectImportBundle(manifest);
    expect(inspection.brokenReferences).toHaveLength(2);
    expect(inspection.brokenReferences.find((reference) => reference.source === brokenImageSource)?.occurrenceCount).toBe(3);

    const snapshot = repository.finalizeImportBundle(manifest, [
      { source: brokenImageSource, action: 'replace', replacementPath },
      { source: brokenVideoSource, action: 'remove' },
    ]);
    closeRepository(repository);

    const importedDeck = snapshot.decks.find((entry) => entry.title === 'Imported Bundle Deck');
    expect(importedDeck).toBeTruthy();
    expect(importedDeck?.templateId).toBeTruthy();

    const importedSlide = snapshot.slides.find((slide) => slide.deckId === importedDeck?.id);
    expect(importedSlide).toBeTruthy();

    const importedSlideElements = snapshot.slideElements.filter((element) => element.slideId === importedSlide?.id);
    expect(importedSlideElements).toHaveLength(2);
    expect(importedSlideElements.every((element) => (element.payload as { src: string }).src === toCastMediaSource(replacementPath))).toBe(true);

    const importedTemplate = snapshot.templates.find((entry) => entry.id === importedDeck?.templateId);
    expect(importedTemplate).toBeTruthy();
    expect(importedTemplate?.elements).toHaveLength(1);
    expect((importedTemplate?.elements[0].payload as { src: string }).src).toBe(toCastMediaSource(replacementPath));
    expect(snapshot.mediaAssets.some((asset) => asset.name === 'replacement-image.png' && asset.src === toCastMediaSource(replacementPath))).toBe(true);
  });
});
