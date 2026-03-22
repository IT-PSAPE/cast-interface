import { describe, expect, it } from 'vitest';
import type { AppSnapshot, Slide } from '@core/types';
import { findCreatedSlideIndex } from './slide-context';

function createSlide(id: string, order: number): Slide {
  return {
    id,
    deckId: 'presentation-1',
    lyricId: null,
    width: 1920,
    height: 1080,
    notes: '',
    order,
    createdAt: '',
    updatedAt: '',
  };
}

describe('findCreatedSlideIndex', () => {
  it('returns the index of the newly created slide in the current presentation', () => {
    const snapshot: AppSnapshot = {
      libraries: [],
      libraryBundles: [],
      decks: [{ id: 'presentation-1', title: 'Presentation', type: 'deck', order: 0, createdAt: '', updatedAt: '' }],
      lyrics: [],
      slides: [createSlide('slide-1', 0), createSlide('slide-2', 1)],
      slideElements: [],
      mediaAssets: [],
      overlays: [],
      templates: [],
    };

    expect(findCreatedSlideIndex(snapshot, 'presentation-1', new Set(['slide-1']))).toBe(1);
  });

  it('returns null when no new slide is present', () => {
    const snapshot: AppSnapshot = {
      libraries: [],
      libraryBundles: [],
      decks: [{ id: 'presentation-1', title: 'Presentation', type: 'deck', order: 0, createdAt: '', updatedAt: '' }],
      lyrics: [],
      slides: [createSlide('slide-1', 0)],
      slideElements: [],
      mediaAssets: [],
      overlays: [],
      templates: [],
    };

    expect(findCreatedSlideIndex(snapshot, 'presentation-1', new Set(['slide-1']))).toBeNull();
  });
});
