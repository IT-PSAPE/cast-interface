import { useUI } from '../../../contexts/ui-context';
import { WorkspaceToolbar } from './workspace-toolbar';
import { CanvasStage } from './canvas-stage';
import { SlideGrid } from './slide-grid';
import { SlideOutline } from './slide-outline';
import { WorkspacePresentationStrip } from './workspace-presentation-strip';

export function Workspace() {
  const { canvasViewMode } = useUI();
  const showCanvasStage = canvasViewMode === 'single';

  return (
    <main className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden bg-gradient-to-b from-surface-0/90 to-surface-0">
      <WorkspacePresentationStrip />
      <section className={showCanvasStage ? 'min-h-0 overflow-hidden p-2' : 'hidden'}>
        <CanvasStage />
      </section>
      {canvasViewMode === 'grid' && <SlideGrid />}
      {canvasViewMode === 'outline' && <SlideOutline />}
      <WorkspaceToolbar />
    </main>
  );
}
