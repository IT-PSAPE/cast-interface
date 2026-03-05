import { describe, expect, it } from 'vitest';
import type { SlideElement } from '@core/types';
import { buildSnapshotDiff } from './element-history-utils';

function textElement(id: string, x: number): SlideElement {
  return {
    id,
    slideId: 's-1',
    type: 'text',
    x,
    y: 100,
    width: 400,
    height: 100,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'content',
    payload: { text: 'Line', fontFamily: 'Arial', fontSize: 32, color: '#fff', alignment: 'left' },
    createdAt: '',
    updatedAt: '',
  };
}

describe('buildSnapshotDiff', () => {
  it('creates updates and deletes as expected', () => {
    const current = [textElement('a', 100), textElement('b', 200)];
    const target = [textElement('a', 120), textElement('c', 300)];

    const diff = buildSnapshotDiff(current, target);

    expect(diff.updates).toHaveLength(1);
    expect(diff.updates[0].id).toBe('a');
    expect(diff.creates).toHaveLength(1);
    expect(diff.creates[0].id).toBe('c');
    expect(diff.deletes).toEqual(['b']);
  });
});
