import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useUI } from '../../../contexts/ui-context';
import { useElements } from '../../../contexts/element-context';
import { SidebarTabBar, SidebarTab } from '../../../components/tab-bar';
import { MediaPanel } from './media-panel';
import { OverlayPanel } from './overlay-panel';
import { ShortcutPanel } from './shortcut-panel';
import type { DrawerTab } from '../../../types/ui';

const TABS: Array<{ key: DrawerTab; label: string }> = [
  { key: 'media', label: 'Media' },
  { key: 'overlays', label: 'Overlays' },
  { key: 'shortcuts', label: 'Shortcuts' },
];

const ACCEPTED_TYPES = ['image/', 'video/'];

function hasMediaFiles(transfer: DataTransfer): boolean {
  return Array.from(transfer.items).some(
    (item) => item.kind === 'file' && ACCEPTED_TYPES.some((t) => item.type.startsWith(t)),
  );
}

export function ResourceDrawer() {
  const { drawerTab, setDrawerTab } = useUI();
  const { importMedia } = useElements();
  const [isDragOver, setIsDragOver] = useState(false);

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

  const footerClass = [
    'h-full border-t border-stroke bg-surface-1 grid min-h-0 grid-rows-[auto_1fr]',
    isDragOver ? 'border-t-focus' : '',
  ].join(' ');

  return (
    <footer
      className={footerClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center border-b border-stroke">
        <SidebarTabBar label="Resource tabs">
          {TABS.map((tab) => {
            function handleSelect() { setDrawerTab(tab.key); }
            return (
              <SidebarTab key={tab.key} active={tab.key === drawerTab} onClick={handleSelect}>
                {tab.label}
              </SidebarTab>
            );
          })}
        </SidebarTabBar>

        <div className="ml-auto flex items-center gap-2 px-2">
          {drawerTab === 'media' && (
            <label className="text-text-muted hover:text-text-primary cursor-pointer text-[16px] leading-none transition-colors" aria-label="Import media" title="Import media">
              +
              <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleImport} className="hidden" />
            </label>
          )}
          {drawerTab !== 'shortcuts' && (
            <input
              type="text"
              placeholder="Filter"
              className="bg-surface-2 border border-stroke rounded px-2 py-0.5 text-[12px] text-text-secondary placeholder:text-text-muted w-[140px] outline-none focus:border-focus transition-colors"
            />
          )}
        </div>
      </div>

      <div className="min-h-0 overflow-auto px-2 py-2">
        {drawerTab === 'media' && <MediaPanel />}
        {drawerTab === 'overlays' && <OverlayPanel />}
        {drawerTab === 'shortcuts' && <ShortcutPanel />}
      </div>
    </footer>
  );
}
