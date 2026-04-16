import { useRef } from 'react';
import { ChevronLeft, Folder, LayoutTemplate, Plus } from 'lucide-react';
import { useCast } from '@renderer/contexts/cast-context';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { Button } from '@renderer/components/controls/button';
import { EmptyStatePanel } from '@renderer/components/display/empty-state-panel';
import { Label } from '@renderer/components/display/text';
import { EditableField } from '@renderer/components/form/editable-field';
import { Panel } from '../../components/layout/panel';
import { ContextMenu } from '../../components/overlays/context-menu';
import { ResourceDrawer } from '../../features/resource-bin/resource-drawer';
import { ContinuousSlideGrid } from '../../features/show/continuous-slide-grid';
import { ContinuousSlideList } from '../../features/show/continuous-slide-list';
import { LibraryBrowserProvider } from '../../features/show/library-browser-context';
import { useLibraryBrowser } from '../../features/show/library-browser-context';
import { useLibraryPanelState } from '../../features/show/library-panel-context';
import { PlaylistList } from '../../features/show/playlist-list';
import { PreviewPanel } from '../../features/show/preview-panel';
import { SegmentsBrowser } from '../../features/show/segments-browser';
import { SlideBrowserToolbar } from '../../features/show/slide-browser-toolbar';
import { SlideGrid } from '../../features/show/slide-grid';
import { SlideList } from '../../features/show/slide-list';
import { useSlideBrowserView } from '../../features/show/use-slide-browser-view';
import { PanelRoute } from '../../features/workbench/panel-route';

export function ShowScreen() {
  return (
    <LibraryBrowserProvider>
      <ShowScreenContent />
    </LibraryBrowserProvider>
  );
}

function ShowScreenContent() {
  const { snapshot } = useCast();
  const { state: libraryBrowserState, actions: libraryBrowserActions } = useLibraryBrowser();
  const { currentLibraryBundle, selectLibrary, createLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();
  const state = useSlideBrowserView();
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleCreateLibrary() {
    void createLibrary();
  }

  function handleBackToLibraries() {
    libraryBrowserActions.setLibrariesView();
  }

  return (
    <section data-ui-region="show-mode-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="show-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="show-left" defaultSize={300} minSize={140} collapsible>
          <Panel as="aside" bordered="right" data-ui-region="library-panel">
            {libraryPanelView === 'libraries' && snapshot ? (
              <>
                <Panel.Header>
                  <Label.sm className="mr-auto pl-1">Library</Label.sm>
                  <Button.Icon label="New library" onClick={handleCreateLibrary}>
                    <Plus />
                  </Button.Icon>
                </Panel.Header>
                <Panel.Section className="space-y-1 px-1.5 py-2">
                  {snapshot.libraryBundles.map((bundle) => {
                    const isEditing = bundle.library.id === recentlyCreatedId || libraryBrowserActions.isEditing('library', bundle.library.id);

                    function handleSelect() {
                      clearTimeout(clickTimer.current);
                      selectLibrary(bundle.library.id);
                      clickTimer.current = setTimeout(() => {
                        libraryBrowserActions.setPlaylistView();
                      }, 250);
                    }

                    function handleDoubleClick() {
                      clearTimeout(clickTimer.current);
                    }

                    function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
                      libraryBrowserActions.handleLibraryContextMenu(event, bundle.library.id);
                    }

                    function handleRename(name: string) {
                      void renameLibrary(bundle.library.id, name);
                      clearRecentlyCreated();
                      libraryBrowserActions.clearEditing();
                    }

                    return (
                      <Panel.Item
                        key={bundle.library.id}
                        role="button"
                        onClick={handleSelect}
                        onDoubleClick={handleDoubleClick}
                        onContextMenu={handleContextMenu}
                        leading={<Folder size={14} strokeWidth={1.75} />}
                      >
                        <EditableField
                          value={bundle.library.name}
                          onCommit={handleRename}
                          editing={isEditing}
                          className="text-md font-medium"
                        />
                      </Panel.Item>
                    );
                  })}
                </Panel.Section>
              </>
            ) : null}

            {libraryPanelView === 'playlist' && currentLibraryBundle ? (
              <>
                <Panel.Header>
                  <Button.Icon label="New library" onClick={handleBackToLibraries}>
                    <ChevronLeft />
                  </Button.Icon>
                  <Label.sm className="mr-auto pl-1">{currentLibraryBundle.library.name}</Label.sm>
                </Panel.Header>

                <PanelRoute.Split splitId="library-panel" orientation="vertical" className="flex-1">
                  <PanelRoute.Panel id="library-playlists" defaultSize={200} minSize={120}>
                    <PlaylistList />
                  </PanelRoute.Panel>
                  <PanelRoute.Panel id="library-segments" defaultSize={320} minSize={180}>
                    <SegmentsBrowser />
                  </PanelRoute.Panel>
                </PanelRoute.Split>
              </>
            ) : null}

            {libraryBrowserState.menuState ? (
              <ContextMenu
                x={libraryBrowserState.menuState.x}
                y={libraryBrowserState.menuState.y}
                items={libraryBrowserState.menuItems}
                onClose={libraryBrowserActions.closeMenu}
              />
            ) : null}
          </Panel>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="show-center" defaultSize={840} minSize={360}>
          <PanelRoute.Split splitId="show-center" orientation="vertical" className="h-full">
            <PanelRoute.Panel id="show-middle" defaultSize={600} minSize={360}>
              <main data-ui-region="slide-browser" className="flex h-full min-h-0 flex-col overflow-hidden">
                <SlideBrowserToolbar items={state.items} headerVariant={state.headerVariant} />
                <section className="min-h-0 flex-1 overflow-hidden">
                  {state.contentVariant === 'empty' ? (
                    <EmptyStatePanel
                      glyph={<LayoutTemplate />}
                      title="No item selected"
                      description="Select an item from a playlist or from the deck drawer to load slides in the browser."
                    />
                  ) : null}
                  {state.contentVariant === 'single-grid' ? <SlideGrid /> : null}
                  {state.contentVariant === 'single-list' ? <SlideList /> : null}
                  {state.contentVariant === 'continuous-grid' ? <ContinuousSlideGrid items={state.items} /> : null}
                  {state.contentVariant === 'continuous-list' ? <ContinuousSlideList items={state.items} /> : null}
                </section>
              </main>
            </PanelRoute.Panel>
            <PanelRoute.Panel id="show-bottom" defaultSize={260} minSize={96} collapsible>
              <ResourceDrawer />
            </PanelRoute.Panel>
          </PanelRoute.Split>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="show-right" defaultSize={320} minSize={140} collapsible>
          <PreviewPanel />
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </section>
  );
}
