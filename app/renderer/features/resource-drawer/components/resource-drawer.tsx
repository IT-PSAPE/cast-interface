import { createContext, useContext, useState, type ChangeEvent, type ReactNode } from 'react';
import { ContextMenu } from '../../../components/context-menu';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { Tab, TabBar } from '../../../components/tab-bar';
import { useElements } from '../../../contexts/element-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useResourceDrawer } from '../../../contexts/resource-drawer-context';
import { useCreateContentMenu } from '../../../hooks/use-create-presentation-menu';
import { useCreateTemplateMenu } from '../../../hooks/use-create-template-menu';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import type { DrawerTab } from '../../../types/ui';
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
  };
  meta: {
    footerClass: string;
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
  const { setWorkbenchMode } = useWorkbench();
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
    },
    meta: {
      footerClass: [
        'h-full border-t border-border-primary bg-primary grid min-h-0 grid-rows-[auto_1fr]',
        isDragOver ? 'border-t-focus' : ''
      ].join(' '),
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

  return (
    <>
      {meta.showImportAction ? (
        <IconButton label="Import media" size="sm" variant="ghost" className="relative">
          <Icon.plus size={14} strokeWidth={1.5} />
          <input type="file" multiple accept="image/*,video/*" onChange={actions.handleImport} className="absolute inset-0 cursor-pointer opacity-0" />
        </IconButton>
      ) : null}
      {meta.showCreateAction ? (
        <IconButton label="Create item" size="sm" variant="ghost" onClick={actions.handleCreatePresentationMenu}>
          <Icon.plus size={14} strokeWidth={1.5} />
        </IconButton>
      ) : null}
    </>
  );
}

function ResourceDrawerContent() {
  const { actions, state } = useDrawer();

  function handleSelectContent() {
    actions.setDrawerTab('content');
  }

  function handleSelectMedia() {
    actions.setDrawerTab('media');
  }

  function handleSelectTemplates() {
    actions.setDrawerTab('templates');
  }

  return (
    <>
      <div className="border-b border-border-primary px-1 py-0.5">
        <TabBar
          label="Resource tabs"
          className="min-w-0 flex-1"
          actionsClassName="gap-0.5"
          tabsClassName="gap-0.5"
          actions={<ResourceDrawerActions />}
        >
          <Tab active={state.drawerTab === 'content'} onClick={handleSelectContent} className="px-1 py-0.5 text-[11px]">Content</Tab>
          <Tab active={state.drawerTab === 'media'} onClick={handleSelectMedia} className="px-1 py-0.5 text-[11px]">Media</Tab>
          <Tab active={state.drawerTab === 'templates'} onClick={handleSelectTemplates} className="px-1 py-0.5 text-[11px]">Templates</Tab>
        </TabBar>
      </div>
      <div className="min-h-0 overflow-auto px-2 pb-2 pt-1.5">
        {state.drawerTab === 'media' ? <MediaBinPanel filterText="" /> : null}
        {state.drawerTab === 'content' ? <ContentBinPanel filterText="" /> : null}
        {state.drawerTab === 'templates' ? <TemplateBinPanel filterText="" /> : null}
      </div>
    </>
  );
}

export function ResourceDrawer() {
  return (
    <Root>
      <ResourceDrawerContent />
    </Root>
  );
}
