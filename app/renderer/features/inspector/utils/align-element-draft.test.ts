import { describe, expect, it } from 'vitest';
import type { ElementInspectorDraft } from '../../../types/ui';
import { alignElementDraft } from './align-element-draft';

const draft: ElementInspectorDraft = {
  x: 120,
  y: 80,
  width: 400,
  height: 200,
  rotation: 0,
  opacity: 1,
  zIndex: 1,
};

describe('alignElementDraft', () => {
  it('aligns left and right edges against the scene', () => {
    expect(alignElementDraft(draft, 1920, 1080, 'left').x).toBe(0);
    expect(alignElementDraft(draft, 1920, 1080, 'right').x).toBe(1520);
  });

  it('centers horizontally within the scene', () => {
    expect(alignElementDraft(draft, 1920, 1080, 'center').x).toBe(760);
  });

  it('aligns top and bottom edges against the scene', () => {
    expect(alignElementDraft(draft, 1920, 1080, 'top').y).toBe(0);
    expect(alignElementDraft(draft, 1920, 1080, 'bottom').y).toBe(880);
  });

  it('centers vertically within the scene', () => {
    expect(alignElementDraft(draft, 1920, 1080, 'middle').y).toBe(440);
  });
});
