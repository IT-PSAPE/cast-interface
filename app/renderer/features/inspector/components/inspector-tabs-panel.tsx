import { useInspector } from '../../../contexts/inspector-context';
import { Inspector } from './inspector';
import { ContentItemInspector } from './presentation-inspector';
import { ShapeElementInspector } from './shape-element-inspector';
import { SlideInspector } from './slide-inspector';
import { TextElementInspector } from './text-element-inspector';
import { useInspectorAutoTab } from '../hooks/use-inspector-auto-tab';
import { useAvailableInspectorTabs } from '../hooks/use-available-inspector-tabs';

interface InspectorTabsPanelProps {
  className?: string;
  bodyClassName?: string;
}

export function InspectorTabsPanel({ className = '', bodyClassName = '' }: InspectorTabsPanelProps) {
  const { inspectorTab, setInspectorTab } = useInspector();
  const availableTabs = useAvailableInspectorTabs();
  useInspectorAutoTab();

  return (
    <Inspector.Root activeTab={inspectorTab} onTabChange={setInspectorTab} className={className}>
      <Inspector.TabList>
        {availableTabs.map((tab) => (
          <Inspector.Trigger key={tab.name} name={tab.name}>{tab.label}</Inspector.Trigger>
        ))}
      </Inspector.TabList>

      <Inspector.Body className={bodyClassName}>
        <Inspector.Panel name="presentation"><ContentItemInspector /></Inspector.Panel>
        <Inspector.Panel name="slide"><SlideInspector /></Inspector.Panel>
        <Inspector.Panel name="shape"><ShapeElementInspector /></Inspector.Panel>
        <Inspector.Panel name="text"><TextElementInspector /></Inspector.Panel>
      </Inspector.Body>
    </Inspector.Root>
  );
}
