import { useEffect } from 'react';
import { useInspector } from '../contexts/inspector-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element/element-context';

export function useInspectorAutoTab() {
  const { inspectorTab, setInspectorTab } = useInspector();
  const { state: { workbenchMode } } = useWorkbench();
  const { selectedElement } = useElements();
  const hasSelection = Boolean(selectedElement);
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';

  useEffect(() => {
    if (isTemplateEdit) {
      if (!hasSelection) return;
      if (selectedElement?.type === 'text') {
        if (inspectorTab !== 'shape' && inspectorTab !== 'text') setInspectorTab('shape');
        return;
      }
      if (inspectorTab !== 'shape') setInspectorTab('shape');
      return;
    }
    if (isOverlayEdit) {
      if (!hasSelection) {
        if (inspectorTab !== 'slide') setInspectorTab('slide');
        return;
      }

      if (selectedElement?.type === 'text') {
        if (inspectorTab !== 'shape' && inspectorTab !== 'text') setInspectorTab('shape');
        return;
      }

      if (inspectorTab !== 'shape') setInspectorTab('shape');
      return;
    }
    if (hasSelection && (inspectorTab === 'presentation' || inspectorTab === 'slide')) setInspectorTab('shape');
    if (!hasSelection && (inspectorTab === 'shape' || inspectorTab === 'text' || inspectorTab === 'slide')) setInspectorTab('presentation');
  }, [hasSelection, inspectorTab, isOverlayEdit, isTemplateEdit, selectedElement?.type, setInspectorTab]);
}
