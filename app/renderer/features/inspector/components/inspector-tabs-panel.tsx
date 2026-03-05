import { useEffect } from 'react';
import { SidebarTabBar, SidebarTab } from '../../../components/tab-bar';
import { useUI } from '../../../contexts/ui-context';
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
  const { inspectorTab, setInspectorTab } = useUI();
  const { selectedElement } = useElements();
  const hasSelection = Boolean(selectedElement);

  useEffect(() => {
    if (hasSelection && (inspectorTab === 'presentation' || inspectorTab === 'slide')) setInspectorTab('shape');
    if (!hasSelection && (inspectorTab === 'shape' || inspectorTab === 'text')) setInspectorTab('presentation');
  }, [hasSelection, inspectorTab, setInspectorTab]);

  function showPresentationTab() { setInspectorTab('presentation'); }
  function showSlideTab() { setInspectorTab('slide'); }
  function showShapeTab() { setInspectorTab('shape'); }
  function showTextTab() { setInspectorTab('text'); }

  return (
    <section className={`grid min-h-0 grid-rows-[auto_1fr] ${className}`}>
      <div className="border-b border-stroke">
        <SidebarTabBar label="Inspector">
          {!hasSelection && <SidebarTab active={inspectorTab === 'presentation'} onClick={showPresentationTab}>Presentation</SidebarTab>}
          {!hasSelection && <SidebarTab active={inspectorTab === 'slide'} onClick={showSlideTab}>Slide</SidebarTab>}
          {hasSelection && <SidebarTab active={inspectorTab === 'shape'} onClick={showShapeTab}>Shape</SidebarTab>}
          {hasSelection && <SidebarTab active={inspectorTab === 'text'} onClick={showTextTab}>Text</SidebarTab>}
        </SidebarTabBar>
      </div>

      <div className={`min-h-0 overflow-auto p-3 ${bodyClassName}`}>
        {inspectorTab === 'presentation' && <PresentationInspector />}
        {inspectorTab === 'slide' && <SlideInspector />}
        {inspectorTab === 'shape' && <ShapeElementInspector />}
        {inspectorTab === 'text' && <TextElementInspector />}
      </div>
    </section>
  );
}
