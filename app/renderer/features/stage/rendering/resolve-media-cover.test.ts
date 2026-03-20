import { describe, expect, it } from 'vitest';
import { resolveMediaCover } from './resolve-media-cover';

describe('resolveMediaCover', () => {
  it('returns the full source when the aspect ratios already match', () => {
    expect(resolveMediaCover(1920, 1080, 1280, 720)).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });
  });

  it('crops the left and right edges for wider sources', () => {
    expect(resolveMediaCover(2000, 1000, 1000, 1000)).toEqual({
      x: 500,
      y: 0,
      width: 1000,
      height: 1000,
    });
  });

  it('crops the top and bottom edges for taller sources', () => {
    expect(resolveMediaCover(1000, 2000, 1000, 1000)).toEqual({
      x: 0,
      y: 500,
      width: 1000,
      height: 1000,
    });
  });
});
