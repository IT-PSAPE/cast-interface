import { useState } from 'react';
import { DialogFrame } from '../../../components/dialog-frame';
import { AppearanceSettingsPanel } from './appearance-settings-panel';
import { OutputSettingsPanel } from './output-settings-panel';
import { OverlaySettingsPanel } from './overlay-settings-panel';
import { SettingsSidebar, type SettingsTabId } from './settings-sidebar';

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');

  function handleSelectTab(tab: SettingsTabId) {
    setActiveTab(tab);
  }

  return (
    <DialogFrame
      title="Settings"
      onClose={onClose}
      dataUiRegion="settings-dialog"
      bodyClassName="min-h-0"
      popupClassName="max-w-[1040px] h-[min(760px,calc(100vh-2rem))]"
    >
      <div className="grid h-full min-h-0 md:grid-cols-[240px_minmax(0,1fr)]">
        <SettingsSidebar activeTab={activeTab} onSelectTab={handleSelectTab} />
        <section className="min-h-0 overflow-y-auto px-5 py-4">
          {activeTab === 'appearance' ? <AppearanceSettingsPanel /> : null}
          {activeTab === 'output' ? <OutputSettingsPanel /> : null}
          {activeTab === 'overlays' ? <OverlaySettingsPanel /> : null}
        </section>
      </div>
    </DialogFrame>
  );
}
