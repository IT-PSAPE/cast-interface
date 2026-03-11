import { describe, expect, it } from 'vitest';
import { applyTextVisualPayload, applyVisualPayload, readTextVisualPayload, readVisualPayload } from './element-payload';
import type { ShapeElementPayload, TextElementPayload } from './types';

function createTextPayload(): TextElementPayload {
  return {
    text: 'Hello',
    fontFamily: 'Avenir Next',
    fontSize: 72,
    color: '#FFFFFF',
    alignment: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.2,
    caseTransform: 'none',
    weight: '700',
    fillEnabled: false,
    fillColor: '#00000000',
    strokeEnabled: false,
    shadowEnabled: false,
  };
}

function createShapePayload(): ShapeElementPayload {
  return {
    fillColor: '#FF0000',
    borderColor: '#00FF00',
    borderWidth: 2,
    borderRadius: 0,
    fillEnabled: true,
    strokeEnabled: true,
    shadowEnabled: false,
  };
}

describe('element payload helpers', () => {
  it('keeps text box visuals separate from glyph styling', () => {
    const payload = createTextPayload();

    const nextBoxPayload = applyVisualPayload('text', payload, {
      ...readVisualPayload('text', payload),
      fillEnabled: true,
      fillColor: '#112233',
      strokeEnabled: true,
      strokeColor: '#445566',
      strokeWidth: 4,
    }) as TextElementPayload;

    expect(nextBoxPayload.color).toBe('#FFFFFF');
    expect(nextBoxPayload.fillColor).toBe('#112233');
    expect(nextBoxPayload.strokeColor).toBe('#445566');
    expect(nextBoxPayload.strokeWidth).toBe(4);

    const nextTextPayload = applyTextVisualPayload(nextBoxPayload, {
      ...readTextVisualPayload(nextBoxPayload),
      color: '#FEDCBA',
      strokeEnabled: true,
      strokeColor: '#ABCDEF',
      strokeWidth: 3,
    });

    expect(nextTextPayload.color).toBe('#FEDCBA');
    expect(nextTextPayload.textStrokeEnabled).toBe(true);
    expect(nextTextPayload.textStrokeColor).toBe('#ABCDEF');
    expect(nextTextPayload.textStrokeWidth).toBe(3);
    expect(nextTextPayload.fillColor).toBe('#112233');
    expect(nextTextPayload.strokeColor).toBe('#445566');
  });

  it('falls back to safe shape defaults when a stale text payload is read as shape visuals', () => {
    const payload = createTextPayload();

    const visual = readVisualPayload('shape', payload);

    expect(visual.fillColor).toBe('#00000000');
    expect(visual.strokeColor).toBe('#111111');
    expect(visual.strokeWidth).toBe(1);
    expect(visual.fillEnabled).toBe(false);
    expect(visual.strokeEnabled).toBe(false);
  });

  it('falls back to safe shape defaults when legacy shape colors are missing', () => {
    const payload = { ...createShapePayload(), fillColor: undefined, borderColor: undefined, borderWidth: undefined } as unknown as ShapeElementPayload;

    const visual = readVisualPayload('shape', payload);

    expect(visual.fillColor).toBe('#FFFFFF');
    expect(visual.strokeColor).toBe('#111111');
    expect(visual.strokeWidth).toBe(1);
  });
});
