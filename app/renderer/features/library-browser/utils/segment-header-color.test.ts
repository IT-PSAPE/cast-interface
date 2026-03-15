import { describe, expect, it } from 'vitest';
import { getSegmentHeaderColors } from './segment-header-color';

describe('getSegmentHeaderColors', () => {
  it('uses translucent seed colors for the segment surface', () => {
    expect(getSegmentHeaderColors('segment-1', 'red')).toEqual({
      backgroundColor: 'rgba(220, 38, 38, 0.18)',
      textColor: 'color-mix(in srgb, var(--color-text-primary) 88%, #dc2626)'
    });
  });

  it('falls back deterministically when no explicit color is set', () => {
    expect(getSegmentHeaderColors('segment-1', null)).toEqual(getSegmentHeaderColors('segment-1', null));
  });
});
