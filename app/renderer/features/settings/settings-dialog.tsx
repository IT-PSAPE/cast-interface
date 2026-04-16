import { useState } from 'react';
import { Dialog } from '../../components/overlays/dialog';
import { Tabs } from '../../components/display/tabs';
import { AppearanceSettingsPanel } from './appearance-settings-panel';
import { ImportExportSettingsPanel } from './import-export-settings-panel';
import { OutputSettingsPanel } from './output-settings-panel';
import { OverlaySettingsPanel } from './overlay-settings-panel';
import { SettingsSidebar, type SettingsTabId } from './settings-sidebar';

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');

  function handleSelectTab(tab: string) {
    setActiveTab(tab as SettingsTabId);
  }

  return (
    <Dialog.Root open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-ui-region="settings-dialog" className="h-[min(760px,calc(100vh-2rem))] max-w-[1040px]">
            <Dialog.Header>
              <Dialog.Title>Settings</Dialog.Title>
              <Dialog.CloseButton />
            </Dialog.Header>
            <Dialog.Body className="min-h-0">
              <Tabs.Root value={activeTab} onValueChange={handleSelectTab}>
                <div className="grid h-full min-h-0 md:grid-cols-[240px_minmax(0,1fr)]">
                  <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
                  <Tabs.Panels className="min-h-0 overflow-y-auto px-5 py-4">
                    <Tabs.Panel value="appearance"><AppearanceSettingsPanel /></Tabs.Panel>
                    <Tabs.Panel value="output"><OutputSettingsPanel /></Tabs.Panel>
                    <Tabs.Panel value="overlays"><OverlaySettingsPanel /></Tabs.Panel>
                    <Tabs.Panel value="import-export"><ImportExportSettingsPanel /></Tabs.Panel>
                  </Tabs.Panels>
                </div>
              </Tabs.Root>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
