import type {
  GroupElementPayload,
  Id,
  ImageElementPayload,
  ShapeElementPayload,
  SlideElement,
  Template,
  TemplateKind,
  TextElementPayload,
  VideoElementPayload,
} from './types';

function cloneElements(elements: SlideElement[]): SlideElement[] {
  return JSON.parse(JSON.stringify(elements)) as SlideElement[];
}

function cloneElement(element: SlideElement): SlideElement {
  return JSON.parse(JSON.stringify(element)) as SlideElement;
}

function mergeTemplatePayload(templateElement: SlideElement, contentElement: SlideElement | null): SlideElement['payload'] {
  if (!contentElement || templateElement.type !== contentElement.type) {
    return cloneElement(templateElement).payload;
  }

  if (templateElement.type === 'text') {
    const templatePayload = templateElement.payload as TextElementPayload;
    const contentPayload = contentElement.payload as TextElementPayload;
    return { ...templatePayload, text: contentPayload.text };
  }

  if (templateElement.type === 'image') {
    const templatePayload = templateElement.payload as ImageElementPayload;
    const contentPayload = contentElement.payload as ImageElementPayload;
    return { ...templatePayload, src: contentPayload.src };
  }

  if (templateElement.type === 'video') {
    const templatePayload = templateElement.payload as VideoElementPayload;
    const contentPayload = contentElement.payload as VideoElementPayload;
    return {
      ...templatePayload,
      src: contentPayload.src,
      autoplay: contentPayload.autoplay,
      loop: contentPayload.loop,
      muted: contentPayload.muted,
    };
  }

  if (templateElement.type === 'shape') {
    return { ...(templateElement.payload as ShapeElementPayload) };
  }

  return { ...(templateElement.payload as GroupElementPayload) };
}

function consumeTypedMatches(elements: SlideElement[]): Map<SlideElement['type'], SlideElement[]> {
  const matches = new Map<SlideElement['type'], SlideElement[]>();
  for (const element of elements) {
    const bucket = matches.get(element.type) ?? [];
    bucket.push(element);
    matches.set(element.type, bucket);
  }
  return matches;
}

export function isTemplateCompatibleWithPresentation(template: Template, presentationKind: 'canvas' | 'lyrics'): boolean {
  if (template.kind === 'slides') return presentationKind === 'canvas';
  if (template.kind === 'lyrics') return presentationKind === 'lyrics';
  return false;
}

export function applyTemplateToElements(template: Template, contentElements: SlideElement[], slideId: Id): SlideElement[] {
  const matchesByType = consumeTypedMatches(contentElements);

  return cloneElements(template.elements).map((templateElement) => {
    const match = matchesByType.get(templateElement.type)?.shift() ?? null;
    return {
      ...templateElement,
      id: match?.id ?? `${slideId}:${templateElement.id}`,
      slideId,
      payload: mergeTemplatePayload(templateElement, match),
      createdAt: match?.createdAt ?? templateElement.createdAt,
      updatedAt: match?.updatedAt ?? templateElement.updatedAt,
    };
  });
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
