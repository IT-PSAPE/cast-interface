import { createContext, useContext, useState, type ChangeEvent, type ReactNode } from 'react';
import { ContextMenu } from '../../components/overlays/context-menu';
import { Plus } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { Tabs } from '../../components/display/tabs';
import { FileTrigger } from '../../components/form/file-trigger';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useElements } from '../../contexts/element/element-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useResourceDrawer } from './resource-drawer-context';
import { useCreateContentMenu } from '../../hooks/use-create-presentation-menu';
import { useCreateTemplateMenu } from '../../hooks/use-create-template-menu';
import { useGridSize } from '../../hooks/use-grid-size';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { useWorkbench } from '../../contexts/workbench-context';
import type { DrawerTab } from '../../types/ui';
import { MediaBinPanel } from './media-bin-panel';
import { ContentBinPanel } from './presentation-bin-panel';
import { TemplateBinPanel } from './template-bin-panel';

const ACCEPTED_TYPES = ['image/', 'video/'];

interface ResourceDrawerContextValue {
  actions: {
    closeMenu: () => void;
    handleCreatePresentationMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
    showImportAction: boolean;
  };
  state: {
    drawerTab: DrawerTab;
    menuItems: ReturnType<typeof useCreateContentMenu>['menuItems'];
    menuState: ReturnType<typeof useCreateContentMenu>['menuState'];
    templateMenuItems: ReturnType<typeof useCreateTemplateMenu>['menuItems'];
    templateMenuState: ReturnType<typeof useCreateTemplateMenu>['menuState'];
  };
}

const ResourceDrawerContext = createContext<ResourceDrawerContextValue | null>(null);

function hasMediaFiles(transfer: DataTransfer): boolean {
  return Array.from(transfer.items).some((item) => item.kind === 'file' && ACCEPTED_TYPES.some((type) => item.type.startsWith(type)));
}

function useDrawer() {
  const context = useContext(ResourceDrawerContext);
  if (!context) throw new Error('ResourceDrawer components must be used within ResourceDrawerRoot');
  return context;
}

function Root({ children }: { children: ReactNode }) {
  const { drawerTab, setDrawerTab } = useResourceDrawer();
  const { importMedia } = useElements();
  const { createDeck, createLyric } = useNavigation();
  const { createTemplate } = useTemplateEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { gridSize, setGridSize, min: gridSizeMin, max: gridSizeMax, step: gridSizeStep } = useGridSize('recast.grid-size.resource-drawer', 6, 4, 8);
  const [isDragOver, setIsDragOver] = useState(false);
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreateContentMenu({
    createDeck,
    createLyric
  });
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
    if (drawerTab !== 'media' || !hasMediaFiles(event.dataTransfer)) return;
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
    if (drawerTab !== 'media' || event.dataTransfer.files.length === 0) return;
    void importMedia(event.dataTransfer.files);
  }

  function handleCreatePresentationMenu(event: React.MouseEvent<HTMLButtonElement>) {
    if (drawerTab === 'templates') {
      openTemplateMenuFromButton(event.currentTarget);
      return;
    }
    openMenuFromButton(event.currentTarget);
  }

  function handleCloseMenus() {
    closeMenu();
    closeTemplateMenu();
  }

  const value: ResourceDrawerContextValue = {
    actions: {
      closeMenu: handleCloseMenus,
      handleCreatePresentationMenu,
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
      showCreateAction: drawerTab === 'content' || drawerTab === 'templates',
      showImportAction: drawerTab === 'media'
    },
    state: {
      drawerTab,
      menuItems,
      menuState,
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
        {value.state.menuState && value.state.drawerTab === 'content' ? (
          <ContextMenu
            x={value.state.menuState.x}
            y={value.state.menuState.y}
            items={value.state.menuItems}
            onClose={value.actions.closeMenu}
          />
        ) : null}
        {value.state.templateMenuState && value.state.drawerTab === 'templates' ? (
          <ContextMenu
            x={value.state.templateMenuState.x}
            y={value.state.templateMenuState.y}
            items={value.state.templateMenuItems}
            onClose={closeTemplateMenu}
          />
        ) : null}
      </footer>
    </ResourceDrawerContext.Provider>
  );
}

function ResourceDrawerActions() {
  const { actions, meta } = useDrawer();

  function handleImportSelect(_files: FileList, event: ChangeEvent<HTMLInputElement>) {
    actions.handleImport(event);
  }

  return (
    <>
      <GridSizeSlider value={meta.gridSize} min={meta.gridSizeMin} max={meta.gridSizeMax} step={meta.gridSizeStep} onChange={actions.setGridSize} />
      {meta.showImportAction ? (
        <FileTrigger.Root accept="image/*,video/*" multiple onSelect={handleImportSelect} className="relative inline-flex">
          <Button.Icon label="Import media" variant="ghost">
            <Plus />
          </Button.Icon>
        </FileTrigger.Root>
      ) : null}
      {meta.showCreateAction ? (
        <Button.Icon label="Create item" variant="ghost" onClick={actions.handleCreatePresentationMenu}>
          <Plus />
        </Button.Icon>
      ) : null}
    </>
  );
}

function ResourceDrawerContent() {
  const { actions, meta, state } = useDrawer();

  function handleTabChange(value: string) {
    actions.setDrawerTab(value as DrawerTab);
  }

  return (
    <Tabs.Root value={state.drawerTab} onValueChange={handleTabChange}>
      <div className="border-b border-primary px-1 py-0.5">
        <Tabs.List
          label="Resource tabs"
          className="min-w-0 flex-1"
          actionsClassName="gap-0.5"
          tabsClassName="gap-0.5"
          actions={<ResourceDrawerActions />}
        >
          <Tabs.Trigger value="content" className="px-1 py-0.5 text-[11px]">Content</Tabs.Trigger>
          <Tabs.Trigger value="media" className="px-1 py-0.5 text-[11px]">Media</Tabs.Trigger>
          <Tabs.Trigger value="templates" className="px-1 py-0.5 text-[11px]">Templates</Tabs.Trigger>
        </Tabs.List>
      </div>
      <Tabs.Panels className="min-h-0 overflow-auto px-2 pb-2 pt-1.5">
        <Tabs.Panel value="media"><MediaBinPanel filterText="" gridItemSize={meta.gridSize} /></Tabs.Panel>
        <Tabs.Panel value="content"><ContentBinPanel filterText="" gridItemSize={meta.gridSize} /></Tabs.Panel>
        <Tabs.Panel value="templates"><TemplateBinPanel filterText="" gridItemSize={meta.gridSize} /></Tabs.Panel>
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
