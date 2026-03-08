import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { SearchField } from '../../../components/search-field';
import { useResourceDrawer } from '../../../contexts/resource-drawer-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { TabBar, Tab } from '../../../components/tab-bar';
import { MediaBinPanel } from './media-bin-panel';
import { OverlayBinPanel } from './overlay-bin-panel';
import { PresentationBinPanel } from './presentation-bin-panel';
import type { DrawerTab } from '../../../types/ui';
import { Button } from '@renderer/components/button';

const TABS: Array<{ key: DrawerTab; label: string }> = [
  { key: 'media', label: 'Media' },
  { key: 'overlays', label: 'Overlays' },
  { key: 'presentations', label: 'Presentations' },
];

const ACCEPTED_TYPES = ['image/', 'video/'];

function hasMediaFiles(transfer: DataTransfer): boolean {
  return Array.from(transfer.items).some(
    (item) => item.kind === 'file' && ACCEPTED_TYPES.some((t) => item.type.startsWith(t)),
  );
}

export function ResourceDrawer() {
  const { drawerTab, setDrawerTab } = useResourceDrawer();
  const { setWorkbenchMode } = useWorkbench();
  const { importMedia } = useElements();
  const { createOverlay } = useOverlayEditor();
  const { createPresentation } = useNavigation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterText, setFilterText] = useState('');

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    void importMedia(e.target.files);
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    if (drawerTab !== 'media' || !hasMediaFiles(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (drawerTab !== 'media' || e.dataTransfer.files.length === 0) return;
    void importMedia(e.dataTransfer.files);
  }

  function handleCreateOverlay() {
    void createOverlay().then(() => {
      setWorkbenchMode('overlay-editor');
    });
  }

  function handleCreatePresentation() {
    void createPresentation();
  }

  const footerClass = [
    'h-full border-t border-border-primary bg-background-primary_alt grid min-h-0 grid-rows-[auto_1fr]',
    isDragOver ? 'border-t-focus' : '',
  ].join(' ');

  return (
    <footer
      className={footerClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center">
        <TabBar label="Resource tabs">
          {TABS.map((tab) => {
            function handleSelect() { setDrawerTab(tab.key); }
            return (
              <Tab key={tab.key} active={tab.key === drawerTab} onClick={handleSelect}>
                {tab.label}
              </Tab>
            );
          })}
        </TabBar>

        <div className="ml-auto flex items-center gap-2 px-2">
          {drawerTab === 'media' && (
            <label className="text-text-tertiary hover:text-text-primary cursor-pointer text-[16px] leading-none transition-colors" aria-label="Import media" title="Import media">
              +
              <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleImport} className="hidden" />
            </label>
          )}
          {drawerTab === 'overlays' && (
            <Button type="button" onClick={handleCreateOverlay} aria-label="Create overlay" title="Create overlay">
              +
            </Button>
          )}
          {drawerTab === 'presentations' && (
            <Button
              type="button"
              onClick={handleCreatePresentation}
              aria-label="Create presentation"
              title="Create presentation"
            >
              +
            </Button>
          )}
          <SearchField className="w-[140px]" placeholder="Filter" value={filterText} onChange={setFilterText} />
        </div>
      </div>

      <div className="min-h-0 overflow-auto px-2 py-2">
        {drawerTab === 'media' && <MediaBinPanel filterText={filterText} />}
        {drawerTab === 'overlays' && <OverlayBinPanel filterText={filterText} />}
        {drawerTab === 'presentations' && <PresentationBinPanel filterText={filterText} />}
      </div>
    </footer>
  );
}
