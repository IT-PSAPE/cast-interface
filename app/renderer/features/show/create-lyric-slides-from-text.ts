import type { AppSnapshot, Id } from '@core/types';
import { buildLyricTextElement, parseLyricImportText } from './lyric-text-utils';

interface CreateLyricSlidesFromTextOptions {
  lyricId: Id;
  mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
  text: string;
}

export async function createLyricSlidesFromText({ lyricId, mutate, text }: CreateLyricSlidesFromTextOptions): Promise<Id[]> {
  const rows = parseLyricImportText(text);
  const createdSlideIds: Id[] = [];

  for (const [index, row] of rows.entries()) {
    const previousSlideIds = new Set(createdSlideIds);
    const snapshot = await mutate(() => window.castApi.createSlide({ lyricId }));
    const createdSlideId = findCreatedLyricSlideId(snapshot, lyricId, previousSlideIds);
    if (!createdSlideId) {
      throw new Error('Unable to create lyric slide.');
    }

    createdSlideIds.push(createdSlideId);
    await mutate(() => window.castApi.createElement(buildLyricTextElement(createdSlideId, row)));
    await mutate(() => window.castApi.setSlideOrder({ slideId: createdSlideId, newOrder: index }));
  }

  return createdSlideIds;
}

function findCreatedLyricSlideId(snapshot: AppSnapshot, lyricId: Id, previousSlideIds: Set<Id>): Id | null {
  const createdSlide = snapshot.slides.find((slide) => slide.lyricId === lyricId && !previousSlideIds.has(slide.id));
  return createdSlide?.id ?? null;
}
