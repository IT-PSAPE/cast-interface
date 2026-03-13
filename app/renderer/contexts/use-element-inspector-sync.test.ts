import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, useEffect, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hasInspectorDraftDelta, shouldApplyInspectorDraftPatch, shouldScheduleInspectorAutoSave, useElementInspectorSync } from './use-element-inspector-sync';
import type { Id, SlideElement, TextElementPayload } from '@core/types';

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

function textElement(text: string): SlideElement {
  const payload: TextElementPayload = {
    text,
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#fff',
    alignment: 'left',
    verticalAlign: 'middle',
    weight: '400',
    lineHeight: 1.25,
  };

  return {
    id: 'text-1',
    slideId: 'slide-1',
    type: 'text',
    x: 48,
    y: 64,
    width: 320,
    height: 120,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'content',
    payload,
    createdAt: '',
    updatedAt: '',
  };
}

function InspectorSyncHarness() {
  const [baseElements, setBaseElements] = useState<SlideElement[]>([textElement('Base')]);
  const [draftElements, setDraftElements] = useState<Record<Id, Partial<SlideElement>>>({});
  const hasAppliedDraftRef = useRef(false);
  const inspector = useElementInspectorSync({
    selectedElementId: 'text-1',
    baseElements,
    isCanvasInteracting: false,
    draftElements,
    setDraftElements,
    saveElementUpdate: vi.fn(async () => undefined),
  });

  useEffect(() => {
    if (!inspector.elementPayloadDraft || hasAppliedDraftRef.current) return;
    hasAppliedDraftRef.current = true;
    inspector.setElementPayloadDraft({ ...(inspector.elementPayloadDraft as TextElementPayload), text: 'Draft' });
  }, [inspector]);

  function handlePersistedUpdate() {
    setBaseElements((current) => current.map((element) => (
      element.id === 'text-1'
        ? { ...element, payload: { ...(element.payload as TextElementPayload), text: 'Persisted' } }
        : element
    )));
  }

  return (
    createElement(
      'div',
      null,
      createElement('button', { type: 'button', onClick: handlePersistedUpdate }, 'persist'),
      createElement('output', { 'data-testid': 'payload-text' }, (inspector.elementPayloadDraft as TextElementPayload | null)?.text ?? ''),
      createElement('output', { 'data-testid': 'draft-text' }, ((draftElements['text-1']?.payload as TextElementPayload | undefined)?.text) ?? ''),
    )
  );
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

describe('useElementInspectorSync', () => {
  it('hydrates inspector state from base elements instead of draft patches', async () => {
    render(createElement(InspectorSyncHarness));

    await waitFor(() => {
      expect(screen.getByTestId('payload-text').textContent).toBe('Draft');
      expect(screen.getByTestId('draft-text').textContent).toBe('Draft');
    });

    fireEvent.click(screen.getByRole('button', { name: 'persist' }));

    await waitFor(() => {
      expect(screen.getByTestId('payload-text').textContent).toBe('Persisted');
    });
  });
});
