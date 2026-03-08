import { useRef } from 'react';
import type { MediaAsset } from '@core/types';
import { SceneFrame } from '../../../components/scene-frame';
import { useElements } from '../../../contexts/element-context';
import { useInspector } from '../../../contexts/inspector-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { SceneStage } from '../../stage/rendering/scene-stage';
import { mapViewportPointToScene, type SceneViewportTransform } from '../rendering/use-scene-stage-viewport';

export function StageViewport() {
  const { workbenchMode } = useWorkbench();
  const { setSlideBrowserMode } = useSlideBrowser();
  const { setInspectorTab } = useInspector();
  const { editScene, showScene } = useRenderScenes();
  const { createFromMedia } = useElements();
  const isEditable = workbenchMode === 'slide-editor' || workbenchMode === 'overlay-editor';
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
    setSlideBrowserMode('focus');
    setInspectorTab('shape');
  }

  return (
    <div className="grid h-full min-h-0 place-items-center overflow-hidden bg-background-primary">
      <SceneFrame width={scene.width} height={scene.height} className="max-h-full border border-border-primary shadow-2xl" stageClassName="z-10" checkerboard>
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
