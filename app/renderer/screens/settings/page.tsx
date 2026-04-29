import { useState } from 'react';
import { RecastPanel } from '@renderer/components/layout/panel';
import { SelectableRow } from '../../components/display/selectable-row';
import { AppearanceSettingsPanel } from './appearance-settings-panel';
import { OutputSettingsPanel } from '../../features/playback/output-settings-panel';
import { OverlaySettingsPanel } from '../../features/assets/overlays/overlay-settings-panel';
import { ImportExportPanel } from '../../features/deck/import-export-panel';
import { SplitPanel } from '@renderer/components/layout/panel-split/split-panel';

type SettingsTabId = 'appearance' | 'output' | 'overlays' | 'deck';

const SETTINGS_TABS: Array<{ id: SettingsTabId; title: string }> = [
  { id: 'appearance', title: 'Appearance' },
  { id: 'output', title: 'Output' },
  { id: 'overlays', title: 'Overlays' },
  { id: 'deck', title: 'Deck' },
];

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');

  return (
    <section data-ui-region="settings-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="settings-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="settings-left" defaultSize={240} minSize={180}>
          <RecastPanel.Root className="h-full border-r border-secondary bg-primary/35">
            <RecastPanel.Content className="p-3">
              <div className="flex flex-col gap-1">
              {SETTINGS_TABS.map((tab) => (
                <SelectableRow.Root
                  key={tab.id}
                  selected={tab.id === activeTab}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <SelectableRow.Label>{tab.title}</SelectableRow.Label>
                </SelectableRow.Root>
              ))}
              </div>
            </RecastPanel.Content>
          </RecastPanel.Root>
        </SplitPanel.Segment>

        <SplitPanel.Segment id="settings-right" defaultSize={960} minSize={320}>
          <main className="h-full min-h-0 overflow-auto px-6 py-5">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
              <header className="border-b border-primary pb-4">
                <h1 className="text-lg font-semibold text-primary">Settings</h1>
              </header>
              {activeTab === 'appearance' && <AppearanceSettingsPanel />}
              {activeTab === 'output' && <OutputSettingsPanel />}
              {activeTab === 'overlays' && <OverlaySettingsPanel />}
              {activeTab === 'deck' && <ImportExportPanel />}
            </div>
          </main>
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}
