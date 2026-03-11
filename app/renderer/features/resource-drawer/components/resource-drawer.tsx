import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { SearchField } from '../../../components/search-field';
import { useResourceDrawer } from '../../../contexts/resource-drawer-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { TabBar, Tab } from '../../../components/tab-bar';
import { ContextMenu } from '../../../components/context-menu';
import { MediaBinPanel } from './media-bin-panel';
import { OverlayBinPanel } from './overlay-bin-panel';
import { PresentationBinPanel } from './presentation-bin-panel';
import type { DrawerTab } from '../../../types/ui';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useCreatePresentationMenu } from '../../../hooks/use-create-presentation-menu';

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
  const { createPresentation, createLyric } = useNavigation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterText, setFilterText] = useState('');
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreatePresentationMenu({
    createPresentation,
    createLyric
  });

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

  function handleCreatePresentationMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

  const footerClass = [
    'h-full border-t border-border-primary bg-primary grid min-h-0 grid-rows-[auto_1fr]',
    isDragOver ? 'border-t-focus' : '',
  ].join(' ');

  return (
    <footer
      data-ui-region="resource-drawer"
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
            <IconButton label="Import media" size="sm" variant="ghost" className="relative">
              <Icon.plus size={14} strokeWidth={1.5} />
              <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleImport} className="absolute inset-0 cursor-pointer opacity-0" />
            </IconButton>
          )}
          {drawerTab === 'overlays' && (
            <IconButton label="Create overlay" size="sm" variant="ghost" onClick={handleCreateOverlay}>
              <Icon.plus size={14} strokeWidth={1.5} />
            </IconButton>
          )}
          {drawerTab === 'presentations' && (
            <IconButton label="Create presentation or lyric" size="sm" variant="ghost" onClick={handleCreatePresentationMenu}>
              <Icon.plus size={14} strokeWidth={1.5} />
            </IconButton>
          )}
          <SearchField className="w-[140px]" placeholder="Filter" value={filterText} onChange={setFilterText} />
        </div>
      </div>

      <div className="min-h-0 overflow-auto px-2 py-2">
        {drawerTab === 'media' && <MediaBinPanel filterText={filterText} />}
        {drawerTab === 'overlays' && <OverlayBinPanel filterText={filterText} />}
        {drawerTab === 'presentations' && <PresentationBinPanel filterText={filterText} />}
      </div>

      {menuState && drawerTab === 'presentations' ? (
        <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} />
      ) : null}
    </footer>
  );
}
