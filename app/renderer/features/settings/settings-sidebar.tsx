import { SelectableRow } from '../../components/display/selectable-row';
import { Panel } from '../../components/panel';

export type SettingsTabId = 'appearance' | 'output' | 'overlays' | 'import-export';

interface SettingsSidebarProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
}

const SETTINGS_TABS: Array<{ id: SettingsTabId; title: string }> = [
  { id: 'appearance', title: 'Appearance' },
  { id: 'output', title: 'Outputs' },
  { id: 'overlays', title: 'Overlays' },
  { id: 'import-export', title: 'Import / Export' },
];

export function SettingsSidebar({ activeTab, onSelectTab }: SettingsSidebarProps) {
  const tabRows = SETTINGS_TABS.map((tab) => renderTabRow(tab, activeTab, onSelectTab));

  return (
    <Panel.Root as="aside" bordered="right" className="bg-primary/35 p-3">
      <div className="flex flex-col gap-1">{tabRows}</div>
    </Panel.Root>
  );
}

function renderTabRow(tab: { id: SettingsTabId; title: string }, activeTab: SettingsTabId, onSelectTab: (tab: SettingsTabId) => void) {
  function handleClick() {
    onSelectTab(tab.id);
  }

  return (
    <SelectableRow
      key={tab.id}
      selected={tab.id === activeTab}
      title={tab.title}
      onClick={handleClick}
    />
  );
}
