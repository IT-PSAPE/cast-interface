import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TextElementPayload } from '@core/types';
import { closeRepository, createTempUserDataPath } from './store-test-support';

const electronState = vi.hoisted(() => ({ userDataPath: '' }));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => electronState.userDataPath),
  },
}));

import { CastRepository } from './store';

describe('CastRepository presentation template references', () => {
  let userDataPath = '';

  afterEach(() => {
    if (!userDataPath) return;
    fs.rmSync(userDataPath, { recursive: true, force: true });
    userDataPath = '';
  });

  it('stores the assigned template, seeds new slides from it, and resets slides back to it', () => {
    userDataPath = createTempUserDataPath();
    electronState.userDataPath = userDataPath;

    const repository = new CastRepository();
    let snapshot = repository.createLyric('Template Song');
    const lyric = snapshot.lyrics.find((item) => item.title === 'Template Song');
    expect(lyric).toBeDefined();

    snapshot = repository.createSlide({ lyricId: lyric!.id });
    const firstSlide = snapshot.slides.find((item) => item.lyricId === lyric!.id);
    expect(firstSlide).toBeDefined();

    snapshot = repository.createTemplate({
      name: 'Lyric Template Default',
      kind: 'lyrics',
      elements: [{
        id: 'template-text',
        slideId: 'template-slide',
        type: 'text',
        x: 240,
        y: 780,
        width: 1440,
        height: 220,
        rotation: 0,
        opacity: 1,
        zIndex: 24,
        layer: 'content',
        payload: {
          text: 'Template lyric default',
          fontFamily: 'Avenir Next',
          fontSize: 80,
          color: '#FFFFFF',
          alignment: 'center',
          verticalAlign: 'middle',
          lineHeight: 1.2,
          caseTransform: 'none',
          weight: '700',
          visible: true,
          locked: false,
          fillEnabled: false,
          fillColor: '#00000000',
          strokeEnabled: false,
          shadowEnabled: false,
        },
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      }],
    });

    const template = snapshot.templates.find((item) => item.name === 'Lyric Template Default');
    expect(template).toBeDefined();

    snapshot = repository.applyTemplateToContentItem(template!.id, lyric!.id);
    expect(snapshot.lyrics.find((item) => item.id === lyric!.id)?.templateId).toBe(template!.id);

    const firstSlideElement = snapshot.slideElements.find((item) => item.slideId === firstSlide!.id);
    expect(firstSlideElement?.x).toBe(240);
    expect((firstSlideElement?.payload as TextElementPayload).text).toBe('Verse line one\nVerse line two');

    snapshot = repository.createSlide({ lyricId: lyric!.id });
    const newSlides = snapshot.slides.filter((item) => item.lyricId === lyric!.id);
    const secondSlide = newSlides.at(-1);
    const secondSlideElement = snapshot.slideElements.find((item) => item.slideId === secondSlide?.id);
    expect(secondSlideElement?.x).toBe(240);
    expect((secondSlideElement?.payload as TextElementPayload).text).toBe('Template lyric default');

    snapshot = repository.updateElement({
      id: firstSlideElement!.id,
      payload: { ...(firstSlideElement!.payload as TextElementPayload), text: 'Edited lyric text' },
    });
    snapshot = repository.resetContentItemToTemplate(lyric!.id);

    const resetFirstSlideElement = snapshot.slideElements.find((item) => item.slideId === firstSlide!.id);
    expect(resetFirstSlideElement?.x).toBe(240);
    expect((resetFirstSlideElement?.payload as TextElementPayload).text).toBe('Template lyric default');

    closeRepository(repository);
  });
});
