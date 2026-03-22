import { useMemo, useRef } from 'react';
import { getSlideContentItemId } from '@core/content-items';
import type { ContentItem, Deck, Id, Lyric, MediaAsset, Overlay, Slide, SlideElement, Template } from '@core/types';
import { sortElements, sortSlides } from '../utils/slides';
import { useCast } from './cast-context';

interface ProjectContent {
  decks: Deck[];
  lyrics: Lyric[];
  contentItems: ContentItem[];
  slides: Slide[];
  slideElements: SlideElement[];
  mediaAssets: MediaAsset[];
  overlays: Overlay[];
  templates: Template[];
  contentItemsById: ReadonlyMap<Id, ContentItem>;
  slidesByContentItemId: ReadonlyMap<Id, Slide[]>;
  slideElementsBySlideId: ReadonlyMap<Id, SlideElement[]>;
  mediaAssetsById: ReadonlyMap<Id, MediaAsset>;
  overlaysById: ReadonlyMap<Id, Overlay>;
  templatesById: ReadonlyMap<Id, Template>;
}

function stableArray<T extends { id: Id; updatedAt: string }>(prev: T[] | null, next: T[]): T[] {
  if (!prev || prev.length !== next.length) return next;
  for (let i = 0; i < next.length; i++) {
    if (prev[i].id !== next[i].id || prev[i].updatedAt !== next[i].updatedAt) return next;
  }
  return prev;
}

export function useProjectContent(): ProjectContent {
  const { snapshot } = useCast();

  const prevRef = useRef<{
    decks: Deck[];
    lyrics: Lyric[];
    slides: Slide[];
    slideElements: SlideElement[];
    mediaAssets: MediaAsset[];
    overlays: Overlay[];
    templates: Template[];
  } | null>(null);

  const stableInputs = useMemo(() => {
    const raw = {
      decks: snapshot?.decks ?? [],
      lyrics: snapshot?.lyrics ?? [],
      slides: snapshot?.slides ?? [],
      slideElements: snapshot?.slideElements ?? [],
      mediaAssets: snapshot?.mediaAssets ?? [],
      overlays: snapshot?.overlays ?? [],
      templates: snapshot?.templates ?? [],
    };

    const prev = prevRef.current;
    const result = {
      decks: stableArray(prev?.decks ?? null, raw.decks),
      lyrics: stableArray(prev?.lyrics ?? null, raw.lyrics),
      slides: stableArray(prev?.slides ?? null, raw.slides),
      slideElements: stableArray(prev?.slideElements ?? null, raw.slideElements),
      mediaAssets: stableArray(prev?.mediaAssets ?? null, raw.mediaAssets),
      overlays: stableArray(prev?.overlays ?? null, raw.overlays),
      templates: stableArray(prev?.templates ?? null, raw.templates),
    };
    prevRef.current = result;
    return result;
  }, [snapshot]);

  const { decks, lyrics, slides, slideElements, mediaAssets, overlays, templates } = stableInputs;

  const contentItems = useMemo(() => {
    return [...decks, ...lyrics].sort((left, right) => left.order - right.order || left.createdAt.localeCompare(right.createdAt));
  }, [decks, lyrics]);

  const contentItemsById = useMemo(() => {
    const map = new Map<Id, ContentItem>();
    for (const item of contentItems) map.set(item.id, item);
    return map;
  }, [contentItems]);

  const slidesByContentItemId = useMemo(() => {
    const map = new Map<Id, Slide[]>();
    for (const item of contentItems) map.set(item.id, []);
    for (const slide of slides) {
      const itemId = getSlideContentItemId(slide);
      if (!itemId) continue;
      const existing = map.get(itemId) ?? [];
      existing.push(slide);
      map.set(itemId, existing);
    }
    map.forEach((contentSlides, itemId) => {
      map.set(itemId, sortSlides(contentSlides));
    });
    return map;
  }, [contentItems, slides]);

  const slideElementsBySlideId = useMemo(() => {
    const map = new Map<Id, SlideElement[]>();
    for (const slide of slides) map.set(slide.id, []);
    for (const element of slideElements) {
      const existing = map.get(element.slideId) ?? [];
      existing.push(element);
      map.set(element.slideId, existing);
    }
    map.forEach((elements, slideId) => {
      map.set(slideId, sortElements(elements));
    });
    return map;
  }, [slides, slideElements]);

  const mediaAssetsById = useMemo(() => {
    const map = new Map<Id, MediaAsset>();
    for (const asset of mediaAssets) map.set(asset.id, asset);
    return map;
  }, [mediaAssets]);

  const overlaysById = useMemo(() => {
    const map = new Map<Id, Overlay>();
    for (const overlay of overlays) map.set(overlay.id, overlay);
    return map;
  }, [overlays]);

  const templatesById = useMemo(() => {
    const map = new Map<Id, Template>();
    for (const template of templates) map.set(template.id, template);
    return map;
  }, [templates]);

  return useMemo(() => ({
    decks,
    lyrics,
    contentItems,
    slides,
    slideElements,
    mediaAssets,
    overlays,
    templates,
    contentItemsById,
    slidesByContentItemId,
    slideElementsBySlideId,
    mediaAssetsById,
    overlaysById,
    templatesById,
  }), [
    decks, lyrics, contentItems, slides, slideElements, mediaAssets, overlays, templates,
    contentItemsById, slidesByContentItemId, slideElementsBySlideId,
    mediaAssetsById, overlaysById, templatesById,
  ]);
}
