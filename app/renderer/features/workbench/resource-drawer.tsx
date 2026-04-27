import { createContext, useContext, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Ellipsis, Grid2x2, List } from 'lucide-react';
import { SegmentedControl } from '../../components/controls/segmented-control';
import { Tabs } from '../../components/display/tabs';
import { MediaAssetIcon } from '../../components/display/entity-icon';
import { SelectableRow } from '../../components/display/selectable-row';
import { Dropdown } from '../../components/form/dropdown';
import { FileTrigger } from '../../components/form/file-trigger';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useElements } from '../../contexts/canvas/canvas-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { useResourceDrawer } from './resource-drawer-context';
import { useGridSize } from '../../hooks/use-grid-size';
import type { DrawerTab, ResourceDrawerViewMode } from '../../types/ui';
import { useAudio } from '../../contexts/playback/playback-context';
import { useAudioCoverArt } from '../../hooks/use-audio-cover-art';
import { MediaBinPanel } from '../assets/media/media-bin-panel';
import { DeckBinPanel } from '../deck/deck-bin-panel';
import {
  compareByKey,
  useAudioBinSort,
  useDeckBinSort,
  useMediaBinSort,
  useTemplateBinSort,
  type BinSort,
} from './use-bin-sort';
import { TemplateBinPanel } from '../assets/templates/template-bin-panel';
import { cn } from '@renderer/utils/cn';
import { EmptyState } from '../../components/display/empty-state';

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
  actions: {
    handleDragLeave: (event: React.DragEvent<HTMLElement>) => void;
    handleDragOver: (event: React.DragEvent<HTMLElement>) => void;
    handleDrop: (event: React.DragEvent<HTMLElement>) => void;
    handleImport: (event: ChangeEvent<HTMLInputElement>) => void;
    setDrawerTab: (tab: DrawerTab) => void;
    setGridSize: (size: number) => void;
  };
  meta: {
    footerClass: string;
    gridSize: number;
    gridSizeMax: number;
    gridSizeMin: number;
    gridSizeStep: number;
    showGridSizeControl: boolean;
    showImportAction: boolean;
    showModeControl: boolean;
  };
  state: {
    drawerTab: DrawerTab;
  };
}

const ResourceDrawerContext = createContext<ResourceDrawerContextValue | null>(null);

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

function useDrawer() {
  const context = useContext(ResourceDrawerContext);
  if (!context) throw new Error('ResourceDrawer components must be used within ResourceDrawerRoot');
  return context;
}

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

  const value: ResourceDrawerContextValue = {
    actions: {
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleImport,
      setDrawerTab,
      setGridSize,
    },
    meta: {
      footerClass: [
        'h-full border-t border-primary bg-primary grid min-h-0 grid-rows-[auto_1fr]',
        isDragOver ? 'border-t-focus' : ''
      ].join(' '),
      gridSize,
      gridSizeMax,
      gridSizeMin,
      gridSizeStep,
      showGridSizeControl: drawerViewMode === 'grid' && drawerTab !== 'audio',
      showImportAction: drawerTab === 'media' || drawerTab === 'audio',
      showModeControl: drawerTab !== 'audio',
    },
    state: {
      drawerTab,
    }
  };

  return (
    <ResourceDrawerContext.Provider value={value}>
      <footer
        data-ui-region="resource-drawer"
        className={`${value.meta.footerClass} overflow-hidden`}
        onDragOver={value.actions.handleDragOver}
        onDragLeave={value.actions.handleDragLeave}
        onDrop={value.actions.handleDrop}
      >
        {children}
      </footer>
    </ResourceDrawerContext.Provider>
  );
}

function isResourceDrawerViewMode(value: string): value is ResourceDrawerViewMode {
  return value === 'grid' || value === 'list';
}

function ResourceDrawerContent() {
  const { actions, meta, state } = useDrawer();
  const { drawerViewMode, setDrawerViewMode } = useResourceDrawer();
  const audio = useAudio();
  const audioSort = useAudioBinSort();
  const deckSort = useDeckBinSort();
  const mediaSort = useMediaBinSort();
  const templateSort = useTemplateBinSort();
  const { createPresentation, createEmptyLyric } = useNavigation();
  const { createTemplate } = useTemplateEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const importInputRef = useRef<HTMLInputElement>(null);

  const sortedAudioAssets = useMemo(() => {
    const direction = audioSort.sort.direction === 'asc' ? 1 : -1;
    return [...audio.audioAssets].sort((a, b) => direction * compareByKey(a, b, audioSort.sort.key, (item) => item.name));
  }, [audio.audioAssets, audioSort.sort]);

  function handleImportSelect(_files: FileList, event: ChangeEvent<HTMLInputElement>) {
    actions.handleImport(event);
  }

  function handleTabChange(value: string) {
    actions.setDrawerTab(value as DrawerTab);
  }

  function handleViewModeChange(nextValue: string | string[]) {
    if (Array.isArray(nextValue)) return;
    if (!isResourceDrawerViewMode(nextValue)) return;
    setDrawerViewMode(nextValue);
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleCreateTemplate(kind: 'slides' | 'lyrics') {
    createTemplate(kind);
    setWorkbenchMode('template-editor');
  }

  return (
    <Tabs.Root value={state.drawerTab} onValueChange={handleTabChange}>
      <div className="h-8 flex border-b border-primary px-1 items-end">
        <Tabs.List label="Resource tabs" className="min-w-0 flex-1" tabsClassName="gap-0.5" >
          <Tabs.Trigger value="deck">Deck</Tabs.Trigger>
          <Tabs.Trigger value="media">Media</Tabs.Trigger>
          <Tabs.Trigger value="audio">Audio</Tabs.Trigger>
          <Tabs.Trigger value="templates">Templates</Tabs.Trigger>
        </Tabs.List>
        <div className={cn('flex shrink-0 items-center gap-0.5 py-0.5')}>
          {meta.showGridSizeControl ? <GridSizeSlider value={meta.gridSize} min={meta.gridSizeMin} max={meta.gridSizeMax} step={meta.gridSizeStep} onChange={actions.setGridSize} /> : null}
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
          <Dropdown>
            <Dropdown.Trigger aria-label="More actions" className={TRIGGER_CLASS}>
              <Ellipsis />
            </Dropdown.Trigger>
            <Dropdown.Panel placement="bottom-end">
              {state.drawerTab === 'deck' && (
                <>
                  <Dropdown.Item onClick={() => { void createPresentation(); }}>New presentation</Dropdown.Item>
                  <Dropdown.Item onClick={() => { void createEmptyLyric(); }}>New lyric</Dropdown.Item>
                  <Dropdown.Separator />
                  <SortMenuItems options={DECK_SORT_OPTIONS} sort={deckSort.sort} onChange={deckSort.setSort} />
                </>
              )}
              {state.drawerTab === 'media' && (
                <>
                  <Dropdown.Item onClick={handleImportClick}>Import media</Dropdown.Item>
                  <Dropdown.Separator />
                  <SortMenuItems options={STANDARD_SORT_OPTIONS} sort={mediaSort.sort} onChange={mediaSort.setSort} />
                </>
              )}
              {state.drawerTab === 'audio' && (
                <>
                  <Dropdown.Item onClick={handleImportClick}>Import audio</Dropdown.Item>
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
        </div>
      </div>
      <div className="min-h-0 overflow-auto px-2 pb-2 pt-1.5">
        {state.drawerTab === 'deck' && <DeckBinPanel filterText="" gridItemSize={meta.gridSize} />}
        {state.drawerTab === 'media' && <MediaBinPanel filterText="" gridItemSize={meta.gridSize} />}
        {state.drawerTab === 'audio' && (
          <section className="h-full min-h-0 overflow-auto p-2">
            <div className="flex min-h-full flex-col">
              {sortedAudioAssets.length === 0 ? (
                <EmptyState.Root>
                  <EmptyState.Title>No audio files</EmptyState.Title>
                  <EmptyState.Description>Import audio to build a reusable app-wide audio list.</EmptyState.Description>
                </EmptyState.Root>
              ) : (
                <div className="flex flex-col gap-1">
                  {sortedAudioAssets.map((asset) => (
                    <AudioRow
                      key={asset.id}
                      asset={asset}
                      isSelected={audio.currentAudioAssetId === asset.id}
                      onSelect={() => audio.selectAudio(asset.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        {state.drawerTab === 'templates' && <TemplateBinPanel filterText="" gridItemSize={meta.gridSize} />}
      </div>
    </Tabs.Root>
  );
}

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
      {options.map(({ key, label }) => {
        const active = sort.key === key;
        return (
          <Dropdown.Item key={key} onClick={() => handleSelect(key)}>
            <span className="flex-1">{label}</span>
            {active ? (sort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : null}
          </Dropdown.Item>
        );
      })}
    </>
  );
}

function AudioRow({ asset, isSelected, onSelect }: { asset: import('@core/types').MediaAsset; isSelected: boolean; onSelect: () => void }) {
  const coverArt = useAudioCoverArt(asset.src);

  return (
    <SelectableRow.Root selected={isSelected} onClick={onSelect} className="h-9">
      <SelectableRow.Leading>
        {coverArt ? (
          <img src={coverArt} alt="" className="h-6 w-6 rounded object-cover" />
        ) : (
          <MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />
        )}
      </SelectableRow.Leading>
      <SelectableRow.Label>{asset.name}</SelectableRow.Label>
    </SelectableRow.Root>
  );
}

export function ResourceDrawer() {
  return (
    <Root>
      <ResourceDrawerContent />
    </Root>
  );
}
