import { useEffect } from 'react';
import { ReacstButton } from '@renderer/components/controls/button';
import { RecastPanel } from '@renderer/components/layout/panel';
import { Tabs } from '@renderer/components/display/tabs';
import { useElements } from '@renderer/contexts/canvas/canvas-context';
import { useInspector } from '@renderer/features/inspector/inspector-context';
import { ShapeElementInspector } from '@renderer/features/inspector/shape-element-inspector';
import { TemplateInspector } from '@renderer/features/inspector/template-inspector';
import { TextElementInspector } from '@renderer/features/inspector/text-element-inspector';
import type { InspectorTab } from '@renderer/types/ui';
import { useTemplateEditorScreen } from './screen-context';

export function TemplateEditorInspectorPanel() {
  const { state, actions } = useTemplateEditorScreen();
  const { inspectorTab, setInspectorTab } = useInspector();
  const { selectedElement } = useElements();
  const hasSelection = Boolean(selectedElement);
  const isTextSelected = selectedElement?.type === 'text';

  useEffect(() => {
    if (!hasSelection) {
      if (inspectorTab === 'shape' || inspectorTab === 'text' || inspectorTab === 'slide' || inspectorTab === 'presentation') {
        setInspectorTab('template');
      }
      return;
    }

    if (isTextSelected) {
      if (inspectorTab !== 'shape' && inspectorTab !== 'text') setInspectorTab('shape');
      return;
    }

    if (inspectorTab !== 'shape') setInspectorTab('shape');
  }, [hasSelection, inspectorTab, isTextSelected, setInspectorTab]);

  function handleTabChange(value: string) {
    setInspectorTab(value as InspectorTab);
  }

  return (
    <RecastPanel.Root className="h-full border-l border-secondary" data-ui-region="inspector-panel">
      <Tabs.Root value={inspectorTab} onValueChange={handleTabChange}>
        <section className="flex flex-1 flex-col">
          <div className="border-b border-primary">
            <Tabs.List label="Inspector">
              {!hasSelection && <Tabs.Trigger value="template">Template</Tabs.Trigger>}
              {hasSelection && <Tabs.Trigger value="shape">Shape</Tabs.Trigger>}
              {isTextSelected && <Tabs.Trigger value="text">Text</Tabs.Trigger>}
            </Tabs.List>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {inspectorTab === 'template' && <TemplateInspector />}
            {inspectorTab === 'shape' && <ShapeElementInspector />}
            {inspectorTab === 'text' && <TextElementInspector />}
          </div>
        </section>
      </Tabs.Root>
      {state.currentTemplate && (
        <RecastPanel.Footer className="p-3">
          <div className="flex flex-col gap-2">
            {state.hasPendingChanges && (
              <ReacstButton onClick={() => { void actions.saveChanges(); }} disabled={state.isPushingChanges} className="w-full">
                {state.isPushingChanges ? 'Pushing…' : 'Save Changes'}
              </ReacstButton>
            )}
            <ReacstButton
              variant="ghost"
              onClick={() => { void actions.syncLinkedItems(); }}
              disabled={state.linkedItemCount === 0 || state.isSyncing || state.hasPendingChanges}
              title={state.hasPendingChanges ? 'Push template changes first' : state.linkedItemCount === 0 ? 'No deck items use this template' : undefined}
              className="w-full"
            >
              {state.isSyncing ? 'Syncing…' : `Sync ${state.linkedItemCount} linked ${state.linkedItemCount === 1 ? 'item' : 'items'}`}
            </ReacstButton>
          </div>
        </RecastPanel.Footer>
      )}
    </RecastPanel.Root>
  );
}
