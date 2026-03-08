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
    <aside className="flex flex-col h-full min-h-0 overflow-hidden border-l border-border-primary bg-background-primary_alt">
      <InspectorTabsPanel bodyClassName="p-3" />
      {isOverlayEdit || isSlideEdit ? (
        <div className="border-t border-border-primary p-3">
          <Button onClick={handlePushChanges} disabled={!hasPendingChanges || isPushingChanges} className='w-full'>
            {isPushingChanges ? 'Pushing…' : pushLabel}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
