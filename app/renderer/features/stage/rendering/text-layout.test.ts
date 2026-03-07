import { describe, expect, it } from 'vitest';
import { verticalTextOffset } from './text-layout';

describe('verticalTextOffset', () => {
  it('places top-aligned text at the top edge', () => {
    expect(verticalTextOffset('top', 600, 72)).toBe(0);
  });

  it('places middle-aligned text in the center of the box', () => {
    expect(verticalTextOffset('middle', 600, 72)).toBe(264);
  });

  it('places bottom-aligned text at the bottom edge', () => {
    expect(verticalTextOffset('bottom', 600, 72)).toBe(528);
  });
});
