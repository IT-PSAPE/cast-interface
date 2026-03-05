import { describe, expect, it } from 'vitest';
import { hasInspectorDraftDelta, shouldApplyInspectorDraftPatch, shouldScheduleInspectorAutoSave } from './use-element-inspector-sync';
import type { SlideElement } from '@core/types';

function baseElement(): SlideElement {
  return {
    id: 'el-1',
    slideId: 'slide-1',
    type: 'shape',
    x: 100,
    y: 120,
    width: 300,
    height: 180,
    rotation: 0,
    opacity: 1,
    zIndex: 5,
    layer: 'content',
    payload: { fillColor: '#111', borderColor: '#fff', borderWidth: 0, borderRadius: 0 },
    createdAt: '',
    updatedAt: '',
  };
}

describe('shouldApplyInspectorDraftPatch', () => {
  it('blocks draft patching while canvas interaction is active', () => {
    expect(shouldApplyInspectorDraftPatch(true, 'a', 'a')).toBe(false);
  });

  it('requires owner and selected ids to match', () => {
    expect(shouldApplyInspectorDraftPatch(false, 'a', 'a')).toBe(true);
    expect(shouldApplyInspectorDraftPatch(false, 'a', 'b')).toBe(false);
    expect(shouldApplyInspectorDraftPatch(false, null, 'b')).toBe(false);
    expect(shouldApplyInspectorDraftPatch(false, 'a', null)).toBe(false);
  });
});

describe('shouldScheduleInspectorAutoSave', () => {
  it('blocks autosave during canvas interactions', () => {
    expect(shouldScheduleInspectorAutoSave(true, 'a', 'a', { text: 'Line', fontFamily: 'Arial', fontSize: 24, color: '#fff', alignment: 'left' })).toBe(false);
  });

  it('requires matching owner and selected ids with unlocked payload', () => {
    expect(shouldScheduleInspectorAutoSave(false, 'a', 'a', { text: 'Line', fontFamily: 'Arial', fontSize: 24, color: '#fff', alignment: 'left' })).toBe(true);
    expect(shouldScheduleInspectorAutoSave(false, 'a', 'b', { text: 'Line', fontFamily: 'Arial', fontSize: 24, color: '#fff', alignment: 'left' })).toBe(false);
    expect(shouldScheduleInspectorAutoSave(false, 'a', 'a', { src: '/x.png', locked: true })).toBe(false);
    expect(shouldScheduleInspectorAutoSave(false, null, 'a', null)).toBe(false);
  });
});

describe('hasInspectorDraftDelta', () => {
  it('returns false when draft and payload match base', () => {
    const base = baseElement();
    expect(
      hasInspectorDraftDelta(
        base,
        { x: base.x, y: base.y, width: base.width, height: base.height, rotation: base.rotation, opacity: base.opacity, zIndex: base.zIndex },
        base.payload,
      ),
    ).toBe(false);
  });

  it('returns true when geometry or payload differs from base', () => {
    const base = baseElement();
    expect(
      hasInspectorDraftDelta(
        base,
        { x: base.x + 1, y: base.y, width: base.width, height: base.height, rotation: base.rotation, opacity: base.opacity, zIndex: base.zIndex },
        base.payload,
      ),
    ).toBe(true);
    expect(
      hasInspectorDraftDelta(
        base,
        { x: base.x, y: base.y, width: base.width, height: base.height, rotation: base.rotation, opacity: base.opacity, zIndex: base.zIndex },
        { ...base.payload, fillColor: '#222' },
      ),
    ).toBe(true);
  });
});
