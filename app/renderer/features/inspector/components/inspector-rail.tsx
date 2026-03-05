import { InspectorTabsPanel } from './inspector-tabs-panel';

export function InspectorRail() {
  return (
    <aside className="grid h-full min-h-0 grid-rows-[1fr] overflow-hidden border-l border-stroke bg-surface-1">
      <InspectorTabsPanel />
    </aside>
  );
}
