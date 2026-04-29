import { memo, useMemo } from 'react';
import type { Id, Stage } from '@core/types';
import { LazySceneStage } from '@renderer/components/display/lazy-scene-stage';
import { Thumbnail } from '../../../components/display/thumbnail';
import { SceneFrame } from '../../../components/display/scene-frame';
import { buildRenderScene } from '../../canvas/build-render-scene';
import { BinPanelLayout } from '@renderer/components/layout/collection-layout';
import { useStagePlayback } from '../../../contexts/playback/playback-context';
import { useStageEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { filterByText } from '../../../utils/filter-by-text';

interface StageBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function StageBinPanel({ filterText, gridItemSize }: StageBinPanelProps) {
  const { stages: allStages } = useProjectContent();
  const { currentStageId, setCurrentStageId } = useStagePlayback();
  const { setCurrentStageId: setEditorStageId } = useStageEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();

  const stages = useMemo(
    () => filterByText(allStages, filterText, (stage: Stage) => [stage.name]),
    [allStages, filterText],
  );

  return (
    <BinPanelLayout gridItemSize={gridItemSize}>
      {stages.map((stage, index) => (
        <StageCard
          key={stage.id}
          stage={stage}
          index={index}
          isActive={stage.id === currentStageId}
          onActivate={setCurrentStageId}
          onEdit={(id) => {
            setEditorStageId(id);
            setWorkbenchMode('stage-editor');
          }}
        />
      ))}
    </BinPanelLayout>
  );
}

interface StageCardProps {
  stage: Stage;
  index: number;
  isActive: boolean;
  onActivate: (id: Id | null) => void;
  onEdit: (id: Id) => void;
}

function StageCardImpl({ stage, index, isActive, onActivate, onEdit }: StageCardProps) {
  const scene = useMemo(() => buildRenderScene(null, stage.elements), [stage.elements]);

  function handleActivate() {
    onActivate(isActive ? null : stage.id);
  }

  function handleEdit() {
    onEdit(stage.id);
  }

  return (
    <Thumbnail.Tile onClick={handleActivate} onDoubleClick={handleEdit} selected={isActive}>
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          <LazySceneStage scene={scene} surface="stage" className="absolute inset-0" />
        </SceneFrame>
      </Thumbnail.Body>
      <Thumbnail.Caption>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <span className="min-w-0 truncate text-sm text-tertiary">{stage.name}</span>
        </div>
      </Thumbnail.Caption>
    </Thumbnail.Tile>
  );
}

const StageCard = memo(StageCardImpl);
