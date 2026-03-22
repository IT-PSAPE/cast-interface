import type {
  ContentBundleItem,
  ContentBundleManifest,
  ContentBundleMediaReference,
  ContentBundleTemplate,
  SlideElement,
} from './types';

interface MediaReferenceAccumulator {
  elementTypes: Set<'image' | 'video'>;
  occurrenceCount: number;
}

export function cloneContentBundleManifest(manifest: ContentBundleManifest): ContentBundleManifest {
  return JSON.parse(JSON.stringify(manifest)) as ContentBundleManifest;
}

export function readElementMediaReference(element: SlideElement): { source: string; elementType: 'image' | 'video' } | null {
  if (element.type !== 'image' && element.type !== 'video') return null;
  const source = typeof (element.payload as { src?: string })?.src === 'string'
    ? (element.payload as { src: string }).src
    : '';
  if (!source) return null;
  return { source, elementType: element.type };
}

export function collectContentBundleMediaReferences(
  items: ContentBundleItem[],
  templates: ContentBundleTemplate[],
): ContentBundleMediaReference[] {
  const references = new Map<string, MediaReferenceAccumulator>();

  function collect(elements: SlideElement[]) {
    for (const element of elements) {
      const reference = readElementMediaReference(element);
      if (!reference) continue;
      const current = references.get(reference.source) ?? {
        elementTypes: new Set<'image' | 'video'>(),
        occurrenceCount: 0,
      };
      current.elementTypes.add(reference.elementType);
      current.occurrenceCount += 1;
      references.set(reference.source, current);
    }
  }

  for (const item of items) {
    for (const slide of item.slides) {
      collect(slide.elements);
    }
  }

  for (const template of templates) {
    collect(template.elements);
  }

  return Array.from(references.entries())
    .map(([source, reference]) => ({
      source,
      elementTypes: Array.from(reference.elementTypes).sort(),
      occurrenceCount: reference.occurrenceCount,
    }))
    .sort((left, right) => left.source.localeCompare(right.source));
}

export function normalizeContentBundleManifest(manifest: ContentBundleManifest): ContentBundleManifest {
  return {
    ...manifest,
    mediaReferences: collectContentBundleMediaReferences(manifest.items, manifest.templates),
  };
}
