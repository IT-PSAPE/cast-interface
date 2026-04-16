import { useSlides } from '../../contexts/slide-context';
import { useNavigation } from '../../contexts/navigation-context';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import { useRenderScenes } from '../canvas/render-scene-provider';
import { useDeckBrowser } from './deck-browser-context';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { Thumbnail } from '@renderer/components/display/thumbnail';
import { Play } from 'lucide-react';
import { SceneFrame } from '@renderer/components/display/scene-frame';
import { SceneStage } from '../canvas/scene-stage';

export function SlideGrid() {
  const { currentDeckItemId, currentOutputDeckItemId, isDetachedDeckBrowser } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, activateSlide, setCurrentSlideIndex } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { gridItemSize } = useDeckBrowser();
  const showLiveState = !isDetachedDeckBrowser && currentDeckItemId === currentOutputDeckItemId;

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label="Slides">
        {slides.map((slide, idx) => {
          const elements = slideElementsById.get(slide.id) ?? [];
          const scene = getThumbnailScene(slide.id, 'show');
          if (!scene) return null;
          const state = getSlideVisualState(idx, showLiveState ? liveSlideIndex : -1, currentSlideIndex, elements);

          const isLive = state === 'live';
          const isEmpty = state === 'warning';

          return (
            <Thumbnail.Tile
              onClick={() => activateSlide(idx)}
              onDoubleClick={() => setCurrentSlideIndex(idx)}
              selected={idx === currentSlideIndex}
            >
              <Thumbnail.Body>
                <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                  {isEmpty ? (
                    <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
                      Empty
                    </div>
                  ) : null}
                  <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
                </SceneFrame>
              </Thumbnail.Body>
              {isLive ? (
                <Thumbnail.Overlay position="top-left">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] bg-brand_solid text-white shadow-sm">
                    <Play size={12} strokeWidth={1.9} />
                  </span>
                </Thumbnail.Overlay>
              ) : null}
              <Thumbnail.Caption>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{idx + 1}</span>
                  <span className="min-w-0 truncate text-sm text-tertiary">{slideTextPreview(elements)}</span>
                </div>
              </Thumbnail.Caption>
            </Thumbnail.Tile>
          )
        })}
      </ThumbnailGrid>
    </section>
  );
}
