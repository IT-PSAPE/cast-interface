import { Button } from '../../components/controls/button';
import { Panel } from '../../components/panel';
import { InspectorTabsPanel } from './inspector-tabs-panel';
import { useInspectorPanelPushAction } from './use-inspector-panel-push-action';

export function InspectorPanel() {
  const { state, handlePushChanges } = useInspectorPanelPushAction();

  return (
    <Panel.Root as="aside" bordered="left" data-ui-region="inspector-panel">
      <InspectorTabsPanel className="flex-1" />
      {state.isVisible && <Panel.Footer className="p-3">
        <Button onClick={handlePushChanges} disabled={state.isPushingChanges} className='w-full'>
          {state.isPushingChanges ? 'Pushing…' : state.pushLabel}
        </Button>
      </Panel.Footer>}
    </Panel.Root>
  );
}
