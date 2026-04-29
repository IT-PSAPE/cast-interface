import { createContext, useContext, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Ellipsis, Grid2x2, List } from 'lucide-react';
import { SegmentedControl } from '../../components/controls/segmented-control';
import { Tabs } from '../../components/display/tabs';
import { Dropdown } from '../../components/form/dropdown';
import { FileTrigger } from '../../components/form/file-trigger';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useElements } from '../../contexts/canvas/canvas-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { useCreateDeckItem } from '../deck/create-deck-item';
import { useResourceDrawer } from './resource-drawer-context';
import { useGridSize } from '../../hooks/use-grid-size';
import type { DrawerTab, ResourceDrawerViewMode } from '../../types/ui';
import { AudioBinPanel } from '../assets/audio/audio-bin-panel';
import { MediaBinPanel } from '../assets/media/media-bin-panel';
import { TemplateBinPanel } from '../assets/templates/template-bin-panel';
import { DeckBinPanel } from '../deck/deck-bin-panel';
import {
  useAudioBinSort,
  useDeckBinSort,
  useMediaBinSort,
  useTemplateBinSort,
  type BinSort,
} from './use-bin-sort';
import { cn } from '@renderer/utils/cn';

const DECK_SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'created', label: 'Date created' },
  { key: 'modified', label: 'Date modified' },
  { key: 'slides', label: 'Slide count' },
] as const;

const STANDARD_SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'created', label: 'Date created' },
  { key: 'modified', label: 'Date modified' },
] as const;

const TRIGGER_CLASS = 'cursor-pointer transition-colors p-1 rounded-sm bg-transparent text-tertiary hover:bg-quaternary hover:text-primary [&>svg]:size-4';

const IMPORT_ACCEPT_BY_TAB = {
  media: 'image/*,video/*',
  audio: 'audio/*',
} as const;

const IMPORT_TYPE_PREFIXES_BY_TAB = {
  media: ['image/', 'video/'],
  audio: ['audio/'],
} as const;

interface ResourceDrawerContextValue {
  state: { drawerTab: DrawerTab };
  meta: {
    gridSize: number;
    gridSizeMin: number;
    gridSizeMax: number;
    gridSizeStep: number;
    showGridSizeControl: boolean;
    showImportAction: boolean;
    showModeControl: boolean;
  };
  actions: {
    setDrawerTab: (tab: DrawerTab) => void;
    setGridSize: (size: number) => void;
    handleImport: (event: ChangeEvent<HTMLInputElement>) => void;
  };
}

const ResourceDrawerContext = createContext<ResourceDrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(ResourceDrawerContext);
  if (!context) throw new Error('ResourceDrawer parts must be used within ResourceDrawer.Root');
  return context;
}

function isImportTab(tab: DrawerTab): tab is keyof typeof IMPORT_ACCEPT_BY_TAB {
  return tab === 'media' || tab === 'audio';
}

function hasImportableFiles(transfer: DataTransfer, tab: DrawerTab): boolean {
  if (!isImportTab(tab)) return false;
  return Array.from(transfer.items).some((item) => (
    item.kind === 'file'
    && IMPORT_TYPE_PREFIXES_BY_TAB[tab].some((type) => item.type.startsWith(type))
  ));
}

function isResourceDrawerViewMode(value: string): value is ResourceDrawerViewMode {
  return value === 'grid' || value === 'list';
}

// ─── Root ─────────────────────────────────────────────────
// Owns drag/drop, the drawer context, and Tabs.Root. Holds the outer footer
// element so siblings (Header, Body) sit at one level below.

function Root({ children }: { children: ReactNode }) {
  const { drawerTab, drawerViewMode, setDrawerTab } = useResourceDrawer();
  const { importMedia } = useElements();
  const { gridSize, setGridSize, min: gridSizeMin, max: gridSizeMax, step: gridSizeStep } = useGridSize('recast.grid-size.resource-drawer', 6, 4, 8);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return;
    void importMedia(event.target.files);
    event.target.value = '';
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    if (!hasImportableFiles(event.dataTransfer, drawerTab)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (!isImportTab(drawerTab) || event.dataTransfer.files.length === 0) return;
    void importMedia(event.dataTransfer.files);
  }

  function handleTabChange(value: string) {
    setDrawerTab(value as DrawerTab);
  }

  const value: ResourceDrawerContextValue = {
    state: { drawerTab },
    meta: {
      gridSize,
      gridSizeMin,
      gridSizeMax,
      gridSizeStep,
      showGridSizeControl: drawerViewMode === 'grid' && drawerTab !== 'audio',
      showImportAction: drawerTab === 'media' || drawerTab === 'audio',
      showModeControl: drawerTab !== 'audio',
    },
    actions: { setDrawerTab, setGridSize, handleImport },
  };

  return (
    <ResourceDrawerContext.Provider value={value}>
      <Tabs.Root value={drawerTab} onValueChange={handleTabChange}>
        <footer
          data-ui-region="resource-drawer"
          className={cn(
            'grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden border-t bg-primary',
            isDragOver ? 'border-t-focus' : 'border-t-primary',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children}
        </footer>
      </Tabs.Root>
    </ResourceDrawerContext.Provider>
  );
}

// ─── Header ───────────────────────────────────────────────
// Single flex row: tab list on the left, toolbar controls on the right.

function Header() {
  return (
    <div className="flex h-8 items-end border-b border-primary px-1">
      <Tabs.List label="Resource tabs" className="min-w-0 flex-1" tabsClassName="gap-0.5">
        <Tabs.Trigger value="deck">Deck</Tabs.Trigger>
        <Tabs.Trigger value="media">Media</Tabs.Trigger>
        <Tabs.Trigger value="audio">Audio</Tabs.Trigger>
        <Tabs.Trigger value="templates">Templates</Tabs.Trigger>
      </Tabs.List>
      <Toolbar />
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────
// Right-side controls: grid size, view mode, import file picker, more actions.

function Toolbar() {
  const { actions, meta, state } = useDrawer();
  const { drawerViewMode, setDrawerViewMode } = useResourceDrawer();
  const importInputRef = useRef<HTMLInputElement>(null);

  function handleViewModeChange(nextValue: string | string[]) {
    if (Array.isArray(nextValue)) return;
    if (!isResourceDrawerViewMode(nextValue)) return;
    setDrawerViewMode(nextValue);
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportSelect(_files: FileList, event: ChangeEvent<HTMLInputElement>) {
    actions.handleImport(event);
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5 py-0.5">
      {meta.showGridSizeControl ? (
        <GridSizeSlider
          value={meta.gridSize}
          min={meta.gridSizeMin}
          max={meta.gridSizeMax}
          step={meta.gridSizeStep}
          onChange={actions.setGridSize}
        />
      ) : null}
      {meta.showModeControl ? (
        <SegmentedControl value={drawerViewMode} onValueChange={handleViewModeChange} aria-label="Resource drawer mode">
          <SegmentedControl.Icon value="grid" title="Grid view" aria-label="Grid view">
            <Grid2x2 size={14} strokeWidth={1.5} />
          </SegmentedControl.Icon>
          <SegmentedControl.Icon value="list" title="List view" aria-label="List view">
            <List size={14} strokeWidth={1.5} />
          </SegmentedControl.Icon>
        </SegmentedControl>
      ) : null}
      <FileTrigger.Root
        hidden
        inputRef={importInputRef}
        accept={state.drawerTab === 'audio' ? IMPORT_ACCEPT_BY_TAB.audio : IMPORT_ACCEPT_BY_TAB.media}
        multiple
        onSelect={handleImportSelect}
      />
      <MoreActionsMenu onImportClick={handleImportClick} />
    </div>
  );
}

// ─── More-actions dropdown ────────────────────────────────
// Per-tab content lives here so each tab's actions stay co-located.

function MoreActionsMenu({ onImportClick }: { onImportClick: () => void }) {
  const { state } = useDrawer();
  const { open: openCreateDeckItem } = useCreateDeckItem();
  const { createTemplate } = useTemplateEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const audioSort = useAudioBinSort();
  const deckSort = useDeckBinSort();
  const mediaSort = useMediaBinSort();
  const templateSort = useTemplateBinSort();

  function handleCreateTemplate(kind: 'slides' | 'lyrics') {
    createTemplate(kind);
    setWorkbenchMode('template-editor');
  }

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="More actions" className={TRIGGER_CLASS}>
        <Ellipsis />
      </Dropdown.Trigger>
      <Dropdown.Panel placement="bottom-end">
        {state.drawerTab === 'deck' && (
          <>
            <Dropdown.Item onClick={() => openCreateDeckItem('presentation')}>New presentation</Dropdown.Item>
            <Dropdown.Item onClick={() => openCreateDeckItem('lyric')}>New lyric</Dropdown.Item>
            <Dropdown.Separator />
            <SortMenuItems options={DECK_SORT_OPTIONS} sort={deckSort.sort} onChange={deckSort.setSort} />
          </>
        )}
        {state.drawerTab === 'media' && (
          <>
            <Dropdown.Item onClick={onImportClick}>Import media</Dropdown.Item>
            <Dropdown.Separator />
            <SortMenuItems options={STANDARD_SORT_OPTIONS} sort={mediaSort.sort} onChange={mediaSort.setSort} />
          </>
        )}
        {state.drawerTab === 'audio' && (
          <>
            <Dropdown.Item onClick={onImportClick}>Import audio</Dropdown.Item>
            <Dropdown.Separator />
            <SortMenuItems options={STANDARD_SORT_OPTIONS} sort={audioSort.sort} onChange={audioSort.setSort} />
          </>
        )}
        {state.drawerTab === 'templates' && (
          <>
            <Dropdown.Item onClick={() => handleCreateTemplate('slides')}>New slides template</Dropdown.Item>
            <Dropdown.Item onClick={() => handleCreateTemplate('lyrics')}>New lyrics template</Dropdown.Item>
            <Dropdown.Separator />
            <SortMenuItems options={STANDARD_SORT_OPTIONS} sort={templateSort.sort} onChange={templateSort.setSort} />
          </>
        )}
      </Dropdown.Panel>
    </Dropdown>
  );
}

// ─── Body ─────────────────────────────────────────────────
// Single scrollable container; the active tab decides which bin panel renders.

function Body() {
  const { state, meta } = useDrawer();
  const { drawerTab } = state;
  const gridItemSize = meta.gridSize;

  return (
    <div className="min-h-0 overflow-auto px-2 pb-2 pt-1.5">
      {drawerTab === 'deck' && <DeckBinPanel filterText="" gridItemSize={gridItemSize} />}
      {drawerTab === 'media' && <MediaBinPanel filterText="" gridItemSize={gridItemSize} />}
      {drawerTab === 'audio' && <AudioBinPanel filterText="" gridItemSize={gridItemSize} />}
      {drawerTab === 'templates' && <TemplateBinPanel filterText="" gridItemSize={gridItemSize} />}
    </div>
  );
}

// ─── Sort menu items helper ───────────────────────────────

interface SortMenuItemsProps<K extends string> {
  options: ReadonlyArray<{ key: K; label: string }>;
  sort: BinSort<K>;
  onChange: (next: BinSort<K>) => void;
}

function SortMenuItems<K extends string>({ options, sort, onChange }: SortMenuItemsProps<K>) {
  function handleSelect(key: K) {
    if (sort.key === key) {
      onChange({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onChange({ key, direction: sort.direction });
    }
  }

  return (
    <>
      {options.map((option) => (
        <SortMenuItem key={option.key} option={option} sort={sort} onSelect={handleSelect} />
      ))}
    </>
  );
}

function SortMenuItem<K extends string>({
  option,
  sort,
  onSelect,
}: {
  option: SortMenuItemsProps<K>['options'][number];
  sort: BinSort<K>;
  onSelect: (key: K) => void;
}) {
  const active = sort.key === option.key;

  function handleClick() {
    onSelect(option.key);
  }

  return (
    <Dropdown.Item onClick={handleClick}>
      <span className="flex-1">{option.label}</span>
      {active ? (sort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : null}
    </Dropdown.Item>
  );
}

// ─── Public export ────────────────────────────────────────

export const ResourceDrawer = { Root, Header, Body };
