import { Button } from '../../../components/button';
import { Panel } from '../../../components/panel';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useSlideEditor } from '../../../contexts/slide-editor-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { InspectorTabsPanel } from './inspector-tabs-panel';

export function InspectorPanel() {
  const { workbenchMode } = useWorkbench();
  const overlayEditor = useOverlayEditor();
  const slideEditor = useSlideEditor();
  const { commitOutputScene } = useRenderScenes();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isSlideEdit = workbenchMode === 'slide-editor';
  const hasPendingChanges = isOverlayEdit
    ? overlayEditor.hasPendingChanges
    : isSlideEdit
      ? slideEditor.hasPendingChanges
      : false;
  const isPushingChanges = isOverlayEdit
    ? overlayEditor.isPushingChanges
    : isSlideEdit
      ? slideEditor.isPushingChanges
      : false;
  const pushLabel = isOverlayEdit ? 'Push Overlay' : 'Push Slide';

  async function handlePushChanges() {
    if (isOverlayEdit) {
      await overlayEditor.pushChanges();
    } else {
      await slideEditor.pushChanges();
    }
    commitOutputScene();
  }

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden border-l border-stroke bg-surface-1">
      {isOverlayEdit || isSlideEdit ? (
        <div className="border-b border-stroke p-3">
          <Panel title="Output Push">
            <div className="grid gap-2">
              <p className="m-0 text-[12px] text-text-muted">
                Edits stay local until you push them or switch to another workbench mode.
              </p>
              <Button onClick={handlePushChanges} disabled={!hasPendingChanges || isPushingChanges}>
                {isPushingChanges ? 'Pushing…' : pushLabel}
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}
      <InspectorTabsPanel bodyClassName="p-3" />
    </aside>
  );
}
