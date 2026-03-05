import { describe, expect, it } from 'vitest';
import type { SlideElement } from '@core/types';
import { clearDraftElementsSyncedWithBase } from './use-element-history';

function baseElement(): SlideElement {
  return {
    id: 'a',
    slideId: 'slide-1',
    type: 'shape',
    x: 100,
    y: 120,
    width: 300,
    height: 180,
    rotation: 10,
    opacity: 1,
    zIndex: 5,
    layer: 'content',
    payload: { fillColor: '#111', borderColor: '#fff', borderWidth: 0, borderRadius: 0 },
    createdAt: '',
    updatedAt: '',
  };
}

describe('clearDraftElementsSyncedWithBase', () => {
  it('clears drafts when base already reflects the same values', () => {
    const current: Record<string, Partial<SlideElement>> = { a: { x: 100, y: 120 } };
    const next = clearDraftElementsSyncedWithBase(current, [baseElement()]);
    expect(next).toEqual({});
  });

  it('retains newer draft values while clearing matched keys', () => {
    const current: Record<string, Partial<SlideElement>> = { a: { x: 125, y: 120, rotation: 20 } };
    const next = clearDraftElementsSyncedWithBase(current, [baseElement()]);
    expect(next).toEqual({ a: { x: 125, rotation: 20 } });
  });

  it('clears only keys that match current base values', () => {
    const current: Record<string, Partial<SlideElement>> = { a: { x: 100, y: 140, width: 300 } };
    const next = clearDraftElementsSyncedWithBase(current, [baseElement()]);
    expect(next).toEqual({ a: { y: 140 } });
  });
});
