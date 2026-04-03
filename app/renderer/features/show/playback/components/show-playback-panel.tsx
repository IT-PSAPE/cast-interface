import { useState } from 'react';
import { Tab, TabBar } from '../../../../components/display/tab-bar';
import { ShowAudioPanel } from './show-audio-panel';
import { ShowOverlayPanel } from './show-overlay-panel';
import { ShowOverlayPanelActions } from './show-overlay-panel-actions';

type PreviewPanelTab = 'overlays' | 'audio';

export function ShowPlaybackPanel() {
  const [activeTab, setActiveTab] = useState<PreviewPanelTab>('overlays');

  function handleSelectOverlays() {
    setActiveTab('overlays');
  }

  function handleSelectAudio() {
    setActiveTab('audio');
  }

  const actions = activeTab === 'overlays' ? <ShowOverlayPanelActions /> : null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-border-primary px-2">
        <TabBar label="Show playback tabs" actions={actions}>
          <Tab active={activeTab === 'overlays'} onClick={handleSelectOverlays}>Overlays</Tab>
          <Tab active={activeTab === 'audio'} onClick={handleSelectAudio}>Audio</Tab>
        </TabBar>
      </div>
      {activeTab === 'overlays' ? <ShowOverlayPanel /> : <ShowAudioPanel />}
    </section>
  );
}
