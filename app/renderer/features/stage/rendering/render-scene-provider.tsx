import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useElements } from '../../../contexts/element-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useSlideEditor } from '../../../contexts/slide-editor-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useSlides } from '../../../contexts/slide-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { buildLayeredRenderScene, buildRenderScene, buildThumbnailScene } from './build-render-scene';
import type { RenderScene, SceneSourcePolicy, SceneSurface } from './scene-types';

interface RenderSceneContextValue {
  editScene: RenderScene;
  showScene: RenderScene;
  liveScene: RenderScene;
  outputScene: RenderScene;
  getThumbnailScene: (slideId: Id, surface: SceneSurface) => RenderScene | null;
  commitOutputScene: () => void;
}

const RenderSceneContext = createContext<RenderSceneContextValue | null>(null);

export function thumbnailSourcePolicy(surface: SceneSurface, isCurrentSlide: boolean): SceneSourcePolicy {
  if (surface === 'show' || surface === 'list') return 'persisted';
  if (isCurrentSlide) return 'draft';
  return 'persisted';
}

export function selectThumbnailElements(policy: SceneSourcePolicy, effectiveElements: SlideElement[], persistedElements: SlideElement[]): SlideElement[] {
  if (policy === 'draft') return effectiveElements;
  return persistedElements;
}

export function RenderSceneProvider({ children }: { children: ReactNode }) {
  const { currentSlide, liveSlide, liveElements, slides, slideElementsById } = useSlides();
  const { effectiveElements } = useElements();
  const { currentOverlay } = useOverlayEditor();
  const { getSlideElements } = useSlideEditor();
  const { mediaLayerAsset, activeOverlays, contentLayerVisible } = usePresentationLayers();
  const { workbenchMode } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';

  const editScene = useMemo(() => {
    return buildRenderScene(isOverlayEdit || isTemplateEdit ? null : currentSlide, effectiveElements);
  }, [currentSlide, effectiveElements, isOverlayEdit, isTemplateEdit, currentOverlay?.id]);

  const showScene = useMemo(() => {
    const currentElements = currentSlide ? (slideElementsById.get(currentSlide.id) ?? []) : [];
    return buildRenderScene(currentSlide, currentElements);
  }, [currentSlide, slideElementsById]);

  const liveScene = useMemo(() => {
    return buildLayeredRenderScene({
      slide: liveSlide,
      contentElements: liveElements,
      mediaAsset: mediaLayerAsset,
      overlays: activeOverlays.map((overlay) => ({
        overlay: overlay.overlay,
        opacityMultiplier: overlay.opacityMultiplier,
        stackOrder: overlay.stackOrder,
      })),
      includeContent: contentLayerVisible,
    });
  }, [activeOverlays, contentLayerVisible, liveElements, liveSlide, mediaLayerAsset]);

  // Freeze the output scene when editing so NDI output stays stable
  const isEditing = workbenchMode !== 'show';
  const [frozenOutputScene, setFrozenOutputScene] = useState<RenderScene | null>(null);
  const pendingCommitRef = useRef(false);

  // Snapshot liveScene on entering edit mode; clear on returning to show
  useEffect(() => {
    if (isEditing) {
      setFrozenOutputScene(liveScene);
    } else {
      setFrozenOutputScene(null);
      pendingCommitRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // After push: re-snapshot when liveScene updates with persisted data
  useEffect(() => {
    if (pendingCommitRef.current && isEditing) {
      setFrozenOutputScene(liveScene);
      pendingCommitRef.current = false;
    }
  }, [isEditing, liveScene]);

  const commitOutputScene = useCallback(() => {
    pendingCommitRef.current = true;
  }, []);

  const outputScene = isEditing && frozenOutputScene ? frozenOutputScene : liveScene;

  const editThumbnailScenes = useMemo(() => {
    const sceneMap = new Map<Id, RenderScene>();
    for (const slide of slides) {
      const persistedElements = getSlideElements(slide.id);
      const policy = thumbnailSourcePolicy('slide-editor', currentSlide?.id === slide.id);
      sceneMap.set(slide.id, buildThumbnailScene(slide, selectThumbnailElements(policy, effectiveElements, persistedElements)));
    }
    return sceneMap;
  }, [currentSlide?.id, effectiveElements, getSlideElements, slides]);

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
      outputScene,
      getThumbnailScene,
      commitOutputScene,
    };
  }, [commitOutputScene, currentSlide?.id, editScene, editThumbnailScenes, liveScene, outputScene, persistedThumbnailScenes, showScene]);

  return <RenderSceneContext.Provider value={value}>{children}</RenderSceneContext.Provider>;
}

export function useRenderScenes(): RenderSceneContextValue {
  const ctx = useContext(RenderSceneContext);
  if (!ctx) throw new Error('useRenderScenes must be used within RenderSceneProvider');
  return ctx;
}
