import { describe, expect, it } from 'vitest';
import { applyTemplateToElements, isTemplateCompatibleWithContentItem } from './templates';
import type { SlideElement, Template } from './types';

function createTextElement(input: { id: string; slideId: string; text: string; x?: number; y?: number }): SlideElement {
  return {
    id: input.id,
    slideId: input.slideId,
    type: 'text',
    x: input.x ?? 100,
    y: input.y ?? 100,
    width: 500,
    height: 120,
    rotation: 0,
    opacity: 1,
    zIndex: 10,
    layer: 'content',
    payload: {
      text: input.text,
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
    },
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
  };
}

function createShapeElement(input: { id: string; slideId: string }): SlideElement {
  return {
    id: input.id,
    slideId: input.slideId,
    type: 'shape',
    x: 80,
    y: 80,
    width: 720,
    height: 420,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'background',
    payload: {
      fillColor: '#111111',
      borderColor: '#00000000',
      borderWidth: 0,
      borderRadius: 24,
      fillEnabled: true,
      strokeEnabled: false,
      shadowEnabled: false,
    },
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
  };
}

function createSlideTemplate(): Template {
  return {
    id: 'template-1',
    name: 'Title Slide',
    kind: 'slides',
    width: 1920,
    height: 1080,
    order: 0,
    elements: [
      createShapeElement({ id: 'template-shape', slideId: 'template-1' }),
      createTextElement({ id: 'template-text', slideId: 'template-1', text: 'Template Title', x: 220, y: 420 }),
    ],
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
  };
}

describe('template helpers', () => {
  it('applies template structure while preserving matched content payload', () => {
    const template = createSlideTemplate();
    const currentElements = [
      createShapeElement({ id: 'slide-shape', slideId: 'slide-1' }),
      createTextElement({ id: 'slide-text', slideId: 'slide-1', text: 'Current Slide Title', x: 40, y: 40 }),
    ];

    const appliedElements = applyTemplateToElements(template, currentElements, 'slide-1');
    const appliedText = appliedElements.find((element) => element.type === 'text');

    expect(appliedElements).toHaveLength(2);
    expect(appliedText?.id).toBe('slide-text');
    expect(appliedText?.x).toBe(220);
    expect(appliedText?.y).toBe(420);
    expect('text' in (appliedText?.payload ?? {})).toBe(true);
    expect(appliedText && 'text' in appliedText.payload ? appliedText.payload.text : null).toBe('Current Slide Title');
  });

  it('creates slide-scoped ids for unmatched template elements', () => {
    const template = createSlideTemplate();
    const currentElements = [createTextElement({ id: 'slide-text', slideId: 'slide-2', text: 'Only Text' })];

    const appliedElements = applyTemplateToElements(template, currentElements, 'slide-2');
    const appliedShape = appliedElements.find((element) => element.type === 'shape');

    expect(appliedShape?.id).toBe('slide-2:template-shape');
    expect(appliedShape?.slideId).toBe('slide-2');
  });

  it('matches template kinds to supported presentation kinds', () => {
    expect(isTemplateCompatibleWithContentItem(createSlideTemplate(), 'deck')).toBe(true);
    expect(isTemplateCompatibleWithContentItem(createSlideTemplate(), 'lyric')).toBe(false);
    expect(isTemplateCompatibleWithContentItem({ ...createSlideTemplate(), kind: 'lyrics' }, 'lyric')).toBe(true);
    expect(isTemplateCompatibleWithContentItem({ ...createSlideTemplate(), kind: 'overlays' }, 'deck')).toBe(false);
  });
});
