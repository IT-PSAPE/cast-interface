import { createContext, useContext, useState, type ChangeEvent, type ReactNode } from 'react';
import { ContextMenu } from '../../components/overlays/context-menu';
import { Plus } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { Tabs } from '../../components/display/tabs';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { FileTrigger } from '../../components/form/file-trigger';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useCreateMenu } from '../../hooks/use-create-menu';
import { useElements } from '../../contexts/element/element-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useResourceDrawer } from './resource-drawer-context';
import { useCreateTemplateMenu } from '../../hooks/use-create-template-menu';
import { useGridSize } from '../../hooks/use-grid-size';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { useWorkbench } from '../../contexts/workbench-context';
import type { DrawerTab } from '../../types/ui';
import { CreateLyricDialog } from '../show/create-lyric-dialog';
import { LyricEditorModal } from '../show/lyric-editor-modal';
import { MediaBinPanel } from '../show/media-bin-panel';
import { ContentBinPanel } from '../show/presentation-bin-panel';
import { ResourceDrawerModeControl } from './resource-drawer-mode-control';
import { TemplateBinPanel } from '../show/template-bin-panel';
import { cn } from '@renderer/utils/cn';
import { ShowAudioPanel } from '../show/show-audio-panel';

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
    closeTemplateMenu: () => void;
    handleCreateActionClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
    showCreateAction: boolean;
    showGridSizeControl: boolean;
    showImportAction: boolean;
    showModeControl: boolean;
  };
  state: {
    drawerTab: DrawerTab;
    createMenuItems: ReturnType<typeof useCreateMenu>['menuItems'];
    createMenuState: ReturnType<typeof useCreateMenu>['menuState'];
    templateMenuItems: ReturnType<typeof useCreateTemplateMenu>['menuItems'];
    templateMenuState: ReturnType<typeof useCreateTemplateMenu>['menuState'];
  };
}

const ResourceDrawerContext = createContext<ResourceDrawerContextValue | null>(null);
type ContentCreateAction = 'presentation' | 'lyric-edit' | 'lyric-empty';

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
  const { createPresentation, createEmptyLyric } = useNavigation();
  const { createTemplate } = useTemplateEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { gridSize, setGridSize, min: gridSizeMin, max: gridSizeMax, step: gridSizeStep } = useGridSize('recast.grid-size.resource-drawer', 6, 4, 8);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeCreateAction, setActiveCreateAction] = useState<ContentCreateAction | null>(null);
  const [isCreateLyricDialogOpen, setIsCreateLyricDialogOpen] = useState(false);
  const [isLyricEditorOpen, setIsLyricEditorOpen] = useState(false);
  const {
    menuItems: createMenuItems,
    menuState: createMenuState,
    openMenuFromButton: openCreateMenuFromButton,
    closeMenu: closeCreateMenu,
  } = useCreateMenu(
    () => [
      {
        id: 'create-presentation',
        label: 'Presentation',
        icon: <DeckItemIcon entity="presentation" size={14} strokeWidth={1.75} />,
        onSelect: () => { void handleCreatePresentation(); },
      },
      {
        id: 'create-lyric',
        label: 'Lyric',
        icon: <DeckItemIcon entity="lyric" size={14} strokeWidth={1.75} />,
        onSelect: handleOpenCreateLyricDialog,
      },
    ],
    [createPresentation],
  );
  const {
    menuItems: templateMenuItems,
    menuState: templateMenuState,
    openMenuFromButton: openTemplateMenuFromButton,
    closeMenu: closeTemplateMenu,
  } = useCreateTemplateMenu({
    createTemplate: (kind) => {
      createTemplate(kind);
      setWorkbenchMode('template-editor');
    },
  });

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

  function handleCreateActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (drawerTab === 'templates') {
      openTemplateMenuFromButton(event.currentTarget);
      return;
    }
    openCreateMenuFromButton(event.currentTarget);
  }

  function handleCloseTemplateMenu() {
    closeTemplateMenu();
  }

  function handleCloseCreateLyricDialog() {
    if (activeCreateAction) return;
    setIsCreateLyricDialogOpen(false);
  }

  function handleCloseLyricEditor() {
    setIsLyricEditorOpen(false);
  }

  function handleOpenCreateLyricDialog() {
    closeCreateMenu();
    setIsCreateLyricDialogOpen(true);
  }

  async function handleCreatePresentation() {
    setActiveCreateAction('presentation');

    try {
      await createPresentation();
      setWorkbenchMode('slide-editor');
    } finally {
      setActiveCreateAction(null);
    }
  }

  async function handleCreateEmptyLyricFromDialog() {
    setActiveCreateAction('lyric-empty');

    try {
      await createEmptyLyric();
      setIsCreateLyricDialogOpen(false);
      setWorkbenchMode('slide-editor');
    } finally {
      setActiveCreateAction(null);
    }
  }

  async function handleCreateEditableLyricFromDialog() {
    setActiveCreateAction('lyric-edit');

    try {
      await createEmptyLyric();
      setIsCreateLyricDialogOpen(false);
      setIsLyricEditorOpen(true);
    } finally {
      setActiveCreateAction(null);
    }
  }

  const value: ResourceDrawerContextValue = {
    actions: {
      closeTemplateMenu: handleCloseTemplateMenu,
      handleCreateActionClick,
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
      showCreateAction: drawerTab === 'deck' || drawerTab === 'templates',
      showGridSizeControl: drawerViewMode === 'grid' && drawerTab !== 'audio',
      showImportAction: drawerTab === 'media' || drawerTab === 'audio',
      showModeControl: drawerTab !== 'audio',
    },
    state: {
      drawerTab,
      createMenuItems,
      createMenuState,
      templateMenuItems,
      templateMenuState
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
        {value.state.createMenuState && value.state.drawerTab === 'deck' ? (
          <ContextMenu
            x={value.state.createMenuState.x}
            y={value.state.createMenuState.y}
            items={value.state.createMenuItems}
            onClose={closeCreateMenu}
          />
        ) : null}
        {value.state.templateMenuState && value.state.drawerTab === 'templates' ? (
          <ContextMenu
            x={value.state.templateMenuState.x}
            y={value.state.templateMenuState.y}
            items={value.state.templateMenuItems}
            onClose={value.actions.closeTemplateMenu}
          />
        ) : null}
        <CreateLyricDialog
          isOpen={isCreateLyricDialogOpen}
          isBusy={activeCreateAction !== null}
          onClose={handleCloseCreateLyricDialog}
          onCreateEmptyLyric={handleCreateEmptyLyricFromDialog}
          onCreateEditableLyric={handleCreateEditableLyricFromDialog}
        />
        <LyricEditorModal isOpen={isLyricEditorOpen} onClose={handleCloseLyricEditor} />
      </footer>
    </ResourceDrawerContext.Provider>
  );
}

function ResourceDrawerContent() {
  const { actions, meta, state } = useDrawer();

  function handleImportSelect(_files: FileList, event: ChangeEvent<HTMLInputElement>) {
    actions.handleImport(event);
  }

  function handleTabChange(value: string) {
    actions.setDrawerTab(value as DrawerTab);
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
          {meta.showImportAction &&
            <FileTrigger.Root accept={state.drawerTab === 'audio' ? IMPORT_ACCEPT_BY_TAB.audio : IMPORT_ACCEPT_BY_TAB.media} multiple onSelect={handleImportSelect} className="relative inline-flex">
              <Button.Icon label={state.drawerTab === 'audio' ? 'Import audio' : 'Import media'} variant="ghost"><Plus /></Button.Icon>
            </FileTrigger.Root>
          }
          {meta.showCreateAction && <Button.Icon label="Create item" variant="ghost" onClick={actions.handleCreateActionClick}> <Plus /> </Button.Icon>}
          {meta.showModeControl ? <ResourceDrawerModeControl /> : null}
        </div>
      </div>
      <Tabs.Panels className="min-h-0 overflow-auto px-2 pb-2 pt-1.5">
        <Tabs.Panel value="deck">
          <ContentBinPanel filterText="" gridItemSize={meta.gridSize} />
        </Tabs.Panel>
        <Tabs.Panel value="media">
          <MediaBinPanel filterText="" gridItemSize={meta.gridSize} />
        </Tabs.Panel>
        <Tabs.Panel value="audio">
          <ShowAudioPanel />
        </Tabs.Panel>
        <Tabs.Panel value="templates">
          <TemplateBinPanel filterText="" gridItemSize={meta.gridSize} />
        </Tabs.Panel>
      </Tabs.Panels>
    </Tabs.Root>
  );
}

export function ResourceDrawer() {
  return (
    <Root>
      <ResourceDrawerContent />
    </Root>
  );
}
