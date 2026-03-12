import { describe, expect, it } from 'vitest';
import { resolveSnap, resolveTransformSnap } from './snap-guides';

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

  it('snaps the active transform edge when resizing from the right', () => {
    const next = resolveTransformSnap(
      { id: 'active', x: 100, y: 100, width: 197, height: 100 },
      [],
      300,
      200,
      'middle-right',
    );

    expect(next.x).toBe(100);
    expect(next.width).toBe(200);
    expect(next.guides).toHaveLength(1);
  });

  it('snaps the active transform edge when resizing from the top left corner', () => {
    const next = resolveTransformSnap(
      { id: 'active', x: 104, y: 104, width: 196, height: 96 },
      [{ id: 'target', x: 100, y: 100, width: 20, height: 20 }],
      300,
      200,
      'top-left',
    );

    expect(next.x).toBe(100);
    expect(next.y).toBe(100);
    expect(next.width).toBe(200);
    expect(next.height).toBe(100);
    expect(next.guides).toHaveLength(2);
  });
});
