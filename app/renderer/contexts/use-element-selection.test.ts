import { describe, expect, it } from 'vitest';
import { filterAllowedSelection } from './use-element-selection';

describe('filterAllowedSelection', () => {
  it('returns same reference when selection remains unchanged', () => {
    const current = ['a', 'b'];
    const allowed = new Set(['a', 'b', 'c']);
    const next = filterAllowedSelection(current, allowed);
    expect(next).toBe(current);
  });

  it('returns filtered ids when some selected ids are no longer allowed', () => {
    const current = ['a', 'b', 'c'];
    const allowed = new Set(['a', 'c']);
    const next = filterAllowedSelection(current, allowed);
    expect(next).toEqual(['a', 'c']);
  });
});
