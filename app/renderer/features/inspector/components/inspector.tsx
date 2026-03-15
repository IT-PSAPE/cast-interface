import { createContext, useContext, type ReactNode } from 'react';
import { TabBar, Tab } from '../../../components/tab-bar';
import type { InspectorTab } from '../../../types/ui';

interface InspectorContextValue {
  actions: {
    setActiveTab: (tab: InspectorTab) => void;
  };
  meta: Record<string, never>;
  state: {
    activeTab: InspectorTab;
  };
}

const InspectorTabsContext = createContext<InspectorContextValue | null>(null);

function useInspectorTabs() {
  const ctx = useContext(InspectorTabsContext);
  if (!ctx) throw new Error('Inspector sub-components must be used within Inspector.Root');
  return ctx;
}

interface RootProps {
  children: ReactNode;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  className?: string;
}

function Root({ children, activeTab, onTabChange, className = '' }: RootProps) {
  return (
    <InspectorTabsContext.Provider value={{
      actions: { setActiveTab: onTabChange },
      meta: {},
      state: { activeTab }
    }}>
      <section className={className}>
        {children}
      </section>
    </InspectorTabsContext.Provider>
  );
}

function TabList({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border-primary">
      <TabBar label="Inspector">
        {children}
      </TabBar>
    </div>
  );
}

interface TriggerProps {
  name: InspectorTab;
  children: ReactNode;
}

function Trigger({ name, children }: TriggerProps) {
  const { actions, state } = useInspectorTabs();

  function handleClick() {
    actions.setActiveTab(name);
  }

  return (
    <Tab active={state.activeTab === name} onClick={handleClick}>
      {children}
    </Tab>
  );
}

function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-0 overflow-auto ${className}`}>
      {children}
    </div>
  );
}

interface PanelProps {
  name: InspectorTab;
  children: ReactNode;
}

function Panel({ name, children }: PanelProps) {
  const { state } = useInspectorTabs();
  if (state.activeTab !== name) return null;
  return <>{children}</>;
}

export const Inspector = { Root, TabList, Trigger, Body, Panel };
