import { useMemo } from 'react';
import { buildRenderScene } from '../canvas/build-render-scene';
import type { RenderScene } from '../canvas/scene-types';
import { useStagePlayback } from '../../contexts/playback/playback-context';
import { useProjectContent } from '../../contexts/use-project-content';

// Resolves the RenderScene for the operator-selected stage layout. Returns an
// empty scene when no stage is active so consumers can always render without
// conditional logic.
export function useStageScene(): RenderScene {
  const { currentStageId } = useStagePlayback();
  const { stagesById } = useProjectContent();

  return useMemo(() => {
    const stage = currentStageId ? stagesById.get(currentStageId) ?? null : null;
    return buildRenderScene(null, stage?.elements ?? []);
  }, [currentStageId, stagesById]);
}
