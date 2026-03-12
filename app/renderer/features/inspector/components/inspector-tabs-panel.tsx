import { useEffect } from 'react';
import { TabBar, Tab } from '../../../components/tab-bar';
import { useInspector } from '../../../contexts/inspector-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';
import { PresentationInspector } from './presentation-inspector';
import { ShapeElementInspector } from './shape-element-inspector';
import { SlideInspector } from './slide-inspector';
import { TextElementInspector } from './text-element-inspector';

interface InspectorTabsPanelProps {
  className?: string;
  bodyClassName?: string;
}

export function InspectorTabsPanel({ className = '', bodyClassName = '' }: InspectorTabsPanelProps) {
  const { inspectorTab, setInspectorTab } = useInspector();
  const { workbenchMode } = useWorkbench();
  const { selectedElement } = useElements();
  const hasSelection = Boolean(selectedElement);
  const isOverlayEdit = workbenchMode === 'overlay-editor';

  useEffect(() => {
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
  }, [hasSelection, inspectorTab, isOverlayEdit, selectedElement?.type, setInspectorTab]);

  function showPresentationTab() { setInspectorTab('presentation'); }
  function showSlideTab() { setInspectorTab('slide'); }
  function showShapeTab() { setInspectorTab('shape'); }
  function showTextTab() { setInspectorTab('text'); }

  return (
    <section className={`${className}`}>
      <div className="border-b border-border-primary">
        <TabBar label="Inspector">
          {!isOverlayEdit && !hasSelection && <Tab active={inspectorTab === 'presentation'} onClick={showPresentationTab}>Presentation</Tab>}
          {isOverlayEdit && !hasSelection && <Tab active={inspectorTab === 'slide'} onClick={showSlideTab}>Overlay</Tab>}
          {hasSelection && <Tab active={inspectorTab === 'shape'} onClick={showShapeTab}>Shape</Tab>}
          {hasSelection && selectedElement?.type === 'text' && <Tab active={inspectorTab === 'text'} onClick={showTextTab}>Text</Tab>}
        </TabBar>
      </div>

      <div className={`min-h-0 overflow-auto ${bodyClassName}`}>
        {!isOverlayEdit && inspectorTab === 'presentation' && <PresentationInspector />}
        {isOverlayEdit && inspectorTab === 'slide' && <SlideInspector />}
        {inspectorTab === 'shape' && <ShapeElementInspector />}
        {inspectorTab === 'text' && <TextElementInspector />}
      </div>
    </section>
  );
}
