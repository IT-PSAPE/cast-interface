import { describe, expect, it } from 'vitest';
import { resolveSnap } from './snap-guides';

describe('resolveSnap', () => {
  it('snaps to stage center and emits guide lines within threshold', () => {
    const next = resolveSnap(
      { id: 'active', x: 955, y: 535, width: 10, height: 10 },
      [],
      1920,
      1080,
    );

    expect(next.x).toBe(955);
    expect(next.y).toBe(535);
    expect(next.guides.length).toBeGreaterThan(0);
  });

  it('snaps to nearby object edges', () => {
    const next = resolveSnap(
      { id: 'active', x: 195, y: 195, width: 100, height: 100 },
      [{ id: 'target', x: 100, y: 100, width: 100, height: 100 }],
      1920,
      1080,
    );

    expect(next.x).toBe(200);
    expect(next.y).toBe(200);
  });
});
