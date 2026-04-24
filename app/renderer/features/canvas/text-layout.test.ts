import { describe, expect, it } from 'vitest';
import { measureTextLineLayoutHeight, measureTextLineStackHeight, textLineBleedPadding, textOverflowOffset } from './text-layout';

describe('text layout helpers', () => {
  it('preserves the full font height for the first line', () => {
    expect(measureTextLineStackHeight(1, 64, 0.5)).toBe(64);
    expect(measureTextLineStackHeight(2, 64, 0.5)).toBe(96);
  });

  it('matches Konva line layout height for fixed-height text', () => {
    expect(measureTextLineLayoutHeight(1, 64, 1.25)).toBe(80);
    expect(measureTextLineLayoutHeight(3, 64, 1.25)).toBe(240);
  });

  it('adds bleed padding only when line height is tighter than the font box', () => {
    expect(textLineBleedPadding(64, 1.25)).toBe(0);
    expect(textLineBleedPadding(64, 1)).toBe(0);
    expect(textLineBleedPadding(64, 0.5)).toBe(16);
  });

  it('allows overflowing text to honor vertical alignment', () => {
    expect(textOverflowOffset('top', 120, 240)).toBe(0);
    expect(textOverflowOffset('middle', 120, 240)).toBe(-60);
    expect(textOverflowOffset('bottom', 120, 240)).toBe(-120);
    expect(textOverflowOffset('middle', 240, 120)).toBe(0);
  });
});
