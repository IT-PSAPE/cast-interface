import { useMemo, useRef } from 'react';
import { getSlideDeckItemId } from '@core/deck-items';
import type { DeckItem, Presentation, Id, Lyric, MediaAsset, Overlay, Slide, SlideElement, Template } from '@core/types';
import { sortElements, sortSlides } from '../utils/slides';
import { useCast } from './app-context';

interface ProjectContent {
  presentations: Presentation[];
  lyrics: Lyric[];
  deckItems: DeckItem[];
  slides: Slide[];
  slideElements: SlideElement[];
  mediaAssets: MediaAsset[];
  overlays: Overlay[];
  templates: Template[];
  deckItemsById: ReadonlyMap<Id, DeckItem>;
  slidesByDeckItemId: ReadonlyMap<Id, Slide[]>;
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
    presentations: Presentation[];
    lyrics: Lyric[];
    slides: Slide[];
    slideElements: SlideElement[];
    mediaAssets: MediaAsset[];
    overlays: Overlay[];
    templates: Template[];
  } | null>(null);

  const stableInputs = useMemo(() => {
    const raw = {
      presentations: snapshot?.presentations ?? [],
      lyrics: snapshot?.lyrics ?? [],
      slides: snapshot?.slides ?? [],
      slideElements: snapshot?.slideElements ?? [],
      mediaAssets: snapshot?.mediaAssets ?? [],
      overlays: snapshot?.overlays ?? [],
      templates: snapshot?.templates ?? [],
    };

    const prev = prevRef.current;
    const result = {
      presentations: stableArray(prev?.presentations ?? null, raw.presentations),
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

  const { presentations, lyrics, slides, slideElements, mediaAssets, overlays, templates } = stableInputs;

  const deckItems = useMemo(() => {
    return [...presentations, ...lyrics].sort((left, right) => left.order - right.order || left.createdAt.localeCompare(right.createdAt));
  }, [presentations, lyrics]);

  const deckItemsById = useMemo(() => {
    const map = new Map<Id, DeckItem>();
    for (const item of deckItems) map.set(item.id, item);
    return map;
  }, [deckItems]);

  const slidesByDeckItemId = useMemo(() => {
    const map = new Map<Id, Slide[]>();
    for (const item of deckItems) map.set(item.id, []);
    for (const slide of slides) {
      const itemId = getSlideDeckItemId(slide);
      if (!itemId) continue;
      const existing = map.get(itemId) ?? [];
      existing.push(slide);
      map.set(itemId, existing);
    }
    map.forEach((contentSlides, itemId) => {
      map.set(itemId, sortSlides(contentSlides));
    });
    return map;
  }, [deckItems, slides]);

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
    presentations,
    lyrics,
    deckItems,
    slides,
    slideElements,
    mediaAssets,
    overlays,
    templates,
    deckItemsById,
    slidesByDeckItemId,
    slideElementsBySlideId,
    mediaAssetsById,
    overlaysById,
    templatesById,
  }), [
    presentations, lyrics, deckItems, slides, slideElements, mediaAssets, overlays, templates,
    deckItemsById, slidesByDeckItemId, slideElementsBySlideId,
    mediaAssetsById, overlaysById, templatesById,
  ]);
}
