import { useRef } from 'react';
import type { MediaAsset } from '@core/types';
import { SceneFrame } from '../../../components/scene-frame';
import { useElements } from '../../../contexts/element-context';
import { useUI } from '../../../contexts/ui-context';
import { useRenderScenes } from '../rendering/render-scene-provider';
import { SceneStage } from '../rendering/scene-stage';
import { mapViewportPointToScene, type SceneViewportTransform } from '../rendering/use-scene-stage-viewport';

export function CanvasStage() {
  const { workspaceView, setCanvasViewMode, setInspectorTab } = useUI();
  const { editScene, showScene } = useRenderScenes();
  const { createFromMedia } = useElements();
  const isEditable = workspaceView === 'edit';
  const scene = isEditable ? editScene : showScene;
  const viewportRef = useRef<SceneViewportTransform>({
    viewportWidth: scene.width,
    viewportHeight: scene.height,
    sceneScale: 1,
    sceneOffsetX: 0,
    sceneOffsetY: 0,
    sceneWidth: scene.width,
    sceneHeight: scene.height,
  });

  function handleViewportChange(viewport: SceneViewportTransform) {
    viewportRef.current = viewport;
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!isEditable) return;
    event.preventDefault();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!isEditable) return;
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/x-cast-media');
    if (!raw) return;

    let media: MediaAsset;
    try {
      media = JSON.parse(raw) as MediaAsset;
    } catch {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const point = mapViewportPointToScene(event.clientX, event.clientY, rect, viewportRef.current);
    void createFromMedia(media, point.x, point.y);
    setCanvasViewMode('single');
    setInspectorTab('shape');
  }

  return (
    <div className="grid h-full min-h-0 place-items-center overflow-hidden bg-surface-0">
      <SceneFrame width={scene.width} height={scene.height} className="max-h-full border border-canvas-border shadow-elevated" stageClassName="z-10" checkerboard>
        <SceneStage
          scene={scene}
          editable={isEditable}
          className="h-full w-full"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onViewportChange={handleViewportChange}
        />
      </SceneFrame>
    </div>
  );
}
