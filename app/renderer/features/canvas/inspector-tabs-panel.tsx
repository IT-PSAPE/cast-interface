import { useInspector } from './inspector-context';
import { Tabs } from '../../components/display/tabs';
import { DeckItemInspector } from './presentation-inspector';
import { ShapeElementInspector } from './shape-element-inspector';
import { SlideInspector } from './slide-inspector';
import { TemplateInspector } from './template-inspector';
import { TextElementInspector } from './text-element-inspector';
import { useInspectorAutoTab } from './use-inspector-auto-tab';
import { useAvailableInspectorTabs } from './use-available-inspector-tabs';
import type { InspectorTab } from '../../types/ui';

interface InspectorTabsPanelProps {
  className?: string;
  bodyClassName?: string;
}

export function InspectorTabsPanel({ className = '', bodyClassName = '' }: InspectorTabsPanelProps) {
  const { inspectorTab, setInspectorTab } = useInspector();
  const availableTabs = useAvailableInspectorTabs();
  useInspectorAutoTab();

  function handleTabChange(value: string) {
    setInspectorTab(value as InspectorTab);
  }

  return (
    <Tabs.Root value={inspectorTab} onValueChange={handleTabChange}>
      <section className={className}>
        <div className="border-b border-primary">
          <Tabs.List label="Inspector">
            {availableTabs.map((tab) => (
              <Tabs.Trigger key={tab.name} value={tab.name}>{tab.label}</Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        <div className={`min-h-0 overflow-auto ${bodyClassName}`}>
          {inspectorTab === 'presentation' && <DeckItemInspector />}
          {inspectorTab === 'slide' && <SlideInspector />}
          {inspectorTab === 'template' && <TemplateInspector />}
          {inspectorTab === 'shape' && <ShapeElementInspector />}
          {inspectorTab === 'text' && <TextElementInspector />}
        </div>
      </section>
    </Tabs.Root>
  );
}
