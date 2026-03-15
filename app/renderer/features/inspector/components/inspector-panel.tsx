import { Button } from '../../../components/button';
import { useInspectorPanelPushAction } from '../hooks/use-inspector-panel-push-action';
import { InspectorTabsPanel } from './inspector-tabs-panel';

export function InspectorPanel() {
  const { state, handlePushChanges } = useInspectorPanelPushAction();

  return (
    <aside data-ui-region="inspector-panel" className="flex flex-col h-full min-h-0 overflow-hidden border-l border-border-primary bg-primary" >
      <InspectorTabsPanel className="flex-1" />
      {state.isVisible ? (
        <div className="mt-auto border-t border-border-primary p-3">
          <Button onClick={handlePushChanges} disabled={state.isPushingChanges} className='w-full'>
            {state.isPushingChanges ? 'Pushing…' : state.pushLabel}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
