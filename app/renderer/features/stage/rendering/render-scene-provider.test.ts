import { describe, expect, it } from 'vitest';
import { selectThumbnailElements, thumbnailSourcePolicy } from './render-scene-provider';

describe('thumbnailSourcePolicy', () => {
  it('uses draft source only for current slide in edit surface', () => {
    expect(thumbnailSourcePolicy('slide-editor', true)).toBe('draft');
    expect(thumbnailSourcePolicy('slide-editor', false)).toBe('persisted');
    expect(thumbnailSourcePolicy('show', true)).toBe('persisted');
    expect(thumbnailSourcePolicy('list', true)).toBe('persisted');
  });
});

describe('selectThumbnailElements', () => {
  it('returns elements for selected policy', () => {
    const draft = [{ id: 'draft' }] as never[];
    const persisted = [{ id: 'persisted' }] as never[];
    expect(selectThumbnailElements('draft', draft, persisted)).toBe(draft);
    expect(selectThumbnailElements('persisted', draft, persisted)).toBe(persisted);
    expect(selectThumbnailElements('live', draft, persisted)).toBe(persisted);
  });
});
