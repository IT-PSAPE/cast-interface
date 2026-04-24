import type {
  DeckItemType,
  Id,
  SlideElement,
  Template,
  TemplateKind,
  TextElementPayload,
} from './types';
import { cloneElement } from './clone';

function readTextValues(elements: SlideElement[]): string[] {
  return elements
    .filter((element) => element.type === 'text')
    .map((element) => (element.payload as TextElementPayload).text);
}

function applyTextValue(templateElement: SlideElement, textValues: string[]): SlideElement['payload'] {
  if (templateElement.type === 'text' && textValues.length > 0) {
    const templatePayload = templateElement.payload as TextElementPayload;
    return { ...templatePayload, text: textValues.shift() ?? templatePayload.text };
  }
  return cloneElement(templateElement).payload;
}

export function isTemplateCompatibleWithDeckItem(template: Template, deckItemType: DeckItemType): boolean {
  if (template.kind === 'slides') return deckItemType === 'presentation';
  if (template.kind === 'lyrics') return deckItemType === 'lyric';
  return false;
}

export function applyTemplateToElements(template: Template, contentElements: SlideElement[], slideId: Id): SlideElement[] {
  const textValues = readTextValues(contentElements);

  return template.elements.map((templateElement) => {
    return {
      ...cloneElement(templateElement),
      id: `${slideId}:${templateElement.id}`,
      slideId,
      payload: applyTextValue(templateElement, textValues),
      createdAt: templateElement.createdAt,
      updatedAt: templateElement.updatedAt,
    };
  });
}

export function syncTemplateToElements(template: Template, contentElements: SlideElement[], slideId: Id): SlideElement[] {
  return applyTemplateToElements(template, contentElements, slideId);
}

export function createDefaultTemplateElements(kind: TemplateKind, ownerId: Id, now: string): SlideElement[] {
  if (kind === 'lyrics') {
    return [{
      id: `${ownerId}-text`,
      slideId: ownerId,
      type: 'text',
      x: 180,
      y: 860,
      width: 1560,
      height: 170,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      layer: 'content',
      payload: {
        text: 'Lyric line one\nLyric line two',
        fontFamily: 'Avenir Next',
        fontSize: 72,
        color: '#FFFFFF',
        alignment: 'center',
        verticalAlign: 'middle',
        lineHeight: 1.2,
        caseTransform: 'none',
        weight: '700',
        visible: true,
        locked: false,
        fillEnabled: false,
        fillColor: '#00000000',
        strokeEnabled: false,
        shadowEnabled: false,
      },
      createdAt: now,
      updatedAt: now,
    }];
  }

  return [{
    id: `${ownerId}-text`,
    slideId: ownerId,
    type: 'text',
    x: 200,
    y: 430,
    width: 1520,
    height: 120,
    rotation: 0,
    opacity: 1,
    zIndex: 10,
    layer: 'content',
    payload: {
      text: kind === 'overlays' ? 'Overlay Title' : 'Slide Title',
      fontFamily: 'Helvetica',
      fontSize: 64,
      color: '#FFFFFF',
      alignment: 'center',
      verticalAlign: 'middle',
      lineHeight: 1.2,
      caseTransform: 'none',
      weight: '700',
      visible: true,
      locked: false,
      fillEnabled: false,
      fillColor: '#00000000',
      strokeEnabled: false,
      shadowEnabled: false,
    },
    createdAt: now,
    updatedAt: now,
  }];
}
