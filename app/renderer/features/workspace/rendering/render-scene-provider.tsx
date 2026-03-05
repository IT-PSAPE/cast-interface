import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useElements } from '../../../contexts/element-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useSlides } from '../../../contexts/slide-context';
import { buildLayeredRenderScene, buildRenderScene, buildThumbnailScene } from './build-render-scene';
import type { RenderScene, SceneSourcePolicy, SceneSurface } from './scene-types';

interface RenderSceneContextValue {
  editScene: RenderScene;
  showScene: RenderScene;
  liveScene: RenderScene;
  outputScene: RenderScene;
  getThumbnailScene: (slideId: Id, surface: SceneSurface) => RenderScene | null;
}

const RenderSceneContext = createContext<RenderSceneContextValue | null>(null);

export function thumbnailSourcePolicy(surface: SceneSurface, isCurrentSlide: boolean): SceneSourcePolicy {
  if (surface === 'show' || surface === 'outline') return 'persisted';
  if (isCurrentSlide) return 'draft';
  return 'persisted';
}

export function selectThumbnailElements(policy: SceneSourcePolicy, effectiveElements: SlideElement[], persistedElements: SlideElement[]): SlideElement[] {
  if (policy === 'draft') return effectiveElements;
  return persistedElements;
}

export function RenderSceneProvider({ children }: { children: ReactNode }) {
  const { currentSlide, liveSlide, slides, slideElementsById } = useSlides();
  const { effectiveElements } = useElements();
  const { mediaLayerAsset, overlayLayer, contentLayerVisible } = usePresentationLayers();

  const editScene = useMemo(() => {
    return buildRenderScene(currentSlide, effectiveElements);
  }, [currentSlide, effectiveElements]);

  const liveScene = useMemo(() => {
    const liveElements = liveSlide ? (slideElementsById.get(liveSlide.id) ?? []) : [];
    return buildLayeredRenderScene({
      slide: liveSlide,
      contentElements: liveElements,
      mediaAsset: mediaLayerAsset,
      overlay: overlayLayer,
      includeContent: contentLayerVisible,
    });
  }, [contentLayerVisible, liveSlide, mediaLayerAsset, overlayLayer, slideElementsById]);

  const showScene = liveScene;

  const editThumbnailScenes = useMemo(() => {
    const sceneMap = new Map<Id, RenderScene>();
    for (const slide of slides) {
      const persistedElements = slideElementsById.get(slide.id) ?? [];
      const policy = thumbnailSourcePolicy('edit', currentSlide?.id === slide.id);
      sceneMap.set(slide.id, buildThumbnailScene(slide, selectThumbnailElements(policy, effectiveElements, persistedElements)));
    }
    return sceneMap;
  }, [currentSlide?.id, effectiveElements, slideElementsById, slides]);

  const persistedThumbnailScenes = useMemo(() => {
    const sceneMap = new Map<Id, RenderScene>();
    for (const slide of slides) {
      sceneMap.set(slide.id, buildThumbnailScene(slide, slideElementsById.get(slide.id) ?? []));
    }
    return sceneMap;
  }, [slideElementsById, slides]);

  const value = useMemo<RenderSceneContextValue>(() => {
    function getThumbnailScene(slideId: Id, surface: SceneSurface): RenderScene | null {
      const policy = thumbnailSourcePolicy(surface, currentSlide?.id === slideId);
      if (policy === 'draft') return editThumbnailScenes.get(slideId) ?? null;
      return persistedThumbnailScenes.get(slideId) ?? null;
    }

    return {
      editScene,
      showScene,
      liveScene,
      outputScene: liveScene,
      getThumbnailScene,
    };
  }, [currentSlide?.id, editScene, editThumbnailScenes, liveScene, persistedThumbnailScenes, showScene]);

  return <RenderSceneContext.Provider value={value}>{children}</RenderSceneContext.Provider>;
}

export function useRenderScenes(): RenderSceneContextValue {
  const ctx = useContext(RenderSceneContext);
  if (!ctx) throw new Error('useRenderScenes must be used within RenderSceneProvider');
  return ctx;
}
