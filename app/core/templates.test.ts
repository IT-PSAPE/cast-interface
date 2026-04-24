import { describe, expect, it } from 'vitest';
import type { SlideElement, Template } from './types';
import { applyTemplateToElements, syncTemplateToElements } from './templates';

const now = '2026-01-01T00:00:00.000Z';

function textElement(id: string, slideId: string, text: string, x = 0): SlideElement {
  return {
    id,
    slideId,
    type: 'text',
    x,
    y: 20,
    width: 300,
    height: 80,
    rotation: 0,
    opacity: 1,
    zIndex: 10,
    layer: 'content',
    payload: {
      text,
      fontFamily: 'Avenir Next',
      fontSize: 48,
      color: '#ffffff',
      alignment: 'center',
      weight: '700',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function imageElement(id: string, slideId: string, src: string): SlideElement {
  return {
    id,
    slideId,
    type: 'image',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'background',
    payload: { src },
    createdAt: now,
    updatedAt: now,
  };
}

function template(elements: SlideElement[]): Template {
  return {
    id: 'template-1',
    name: 'Template',
    kind: 'lyrics',
    width: 1920,
    height: 1080,
    elements,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe('template element reconciliation', () => {
  it('rebuilds template-scoped elements and applies text values by slot order', () => {
    const current = [
      imageElement('slide-bg', 'slide-1', '/old-background.jpg'),
      textElement('slide-text', 'slide-1', 'User lyric text', 120),
    ];
    const next = applyTemplateToElements(template([
      imageElement('template-bg', 'template-1', '/new-background.jpg'),
      textElement('template-text', 'template-1', 'Template lyric text', 500),
    ]), current, 'slide-1');

    expect(next).toHaveLength(2);
    expect(next[0]?.id).toBe('slide-1:template-bg');
    expect(next[0]?.payload).toMatchObject({ src: '/new-background.jpg' });
    expect(next[1]?.id).toBe('slide-1:template-text');
    expect(next[1]?.x).toBe(500);
    expect(next[1]?.payload).toMatchObject({ text: 'User lyric text' });
  });

  it('maps multiple content text values to multiple template text slots', () => {
    const current = [
      textElement('slide-title', 'slide-1', 'Document title'),
      textElement('slide-body', 'slide-1', 'Document body'),
    ];
    const next = applyTemplateToElements(template([
      textElement('template-title', 'template-1', 'Title slot'),
      textElement('template-body', 'template-1', 'Body slot'),
    ]), current, 'slide-1');

    expect(next[0]?.payload).toMatchObject({ text: 'Document title' });
    expect(next[1]?.payload).toMatchObject({ text: 'Document body' });
  });

  it('removes content elements that do not map to the new template', () => {
    const current = [
      imageElement('slide-bg', 'slide-1', '/old-background.jpg'),
      textElement('slide-text', 'slide-1', 'User lyric text'),
    ];
    const next = applyTemplateToElements(template([
      textElement('template-text', 'template-1', 'Template lyric text'),
    ]), current, 'slide-1');

    expect(next).toHaveLength(1);
    expect(next[0]?.type).toBe('text');
    expect(next[0]?.payload).toMatchObject({ text: 'User lyric text' });
  });

  it('syncing linked deck items also removes stale extras', () => {
    const current = [
      imageElement('slide-bg', 'slide-1', '/old-background.jpg'),
      textElement('slide-text', 'slide-1', 'User lyric text'),
    ];
    const next = syncTemplateToElements(template([
      textElement('template-text', 'template-1', 'Template lyric text'),
    ]), current, 'slide-1');

    expect(next).toHaveLength(1);
    expect(next.some((element) => element.type === 'image')).toBe(false);
  });
});
