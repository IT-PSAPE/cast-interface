import { useRef } from 'react';
import { ChevronLeft, Folder, LayoutTemplate, Plus } from 'lucide-react';
import { useCast } from '@renderer/contexts/cast-context';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { Button } from '@renderer/components/controls/button';
import { Label } from '@renderer/components/display/text';
import { EditableField } from '@renderer/components/form/editable-field';
import { Panel } from '../../components/layout/panel';
import { ContextMenu } from '../../components/overlays/context-menu';
import { ResourceDrawer } from '../../features/workbench/resource-drawer';
import { ContinuousSlideGrid } from '../../features/deck/continuous-slide-grid';
import { ContinuousSlideList } from '../../features/deck/continuous-slide-list';
import { LibraryBrowserProvider } from '../../features/library/library-browser-context';
import { useLibraryBrowser } from '../../features/library/library-browser-context';
import { useLibraryPanelState } from '../../features/library/library-panel-context';
import { PlaylistList } from '../../features/library/playlist-list';
import { PreviewPanel } from '../../features/playback/preview-panel';
import { SegmentsBrowser } from '../../features/library/segments-browser';
import { DeckBrowserToolbar } from '../../features/deck/deck-browser-toolbar';
import { SlideGrid } from '../../features/deck/slide-grid';
import { SlideList } from '../../features/deck/slide-list';
import { useDeckBrowserView } from '../../features/deck/use-deck-browser-view';
import { SplitPanel } from '../../features/workbench/split-panel';

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
  const state = useDeckBrowserView();
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleCreateLibrary() {
    void createLibrary();
  }

  function handleBackToLibraries() {
    libraryBrowserActions.setLibrariesView();
  }

  return (
    <section data-ui-region="show-mode-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="show-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="show-left" defaultSize={300} minSize={140} collapsible>
          <Panel as="aside" bordered="right" data-ui-region="library-panel">
            {libraryPanelView === 'libraries' && snapshot && (
              <>
                <Panel.Header>
                  <Label.sm className="mr-auto pl-1">Library</Label.sm>
                  <Button.Icon label="New library" onClick={handleCreateLibrary}>
                    <Plus />
                  </Button.Icon>
                </Panel.Header>
                <Panel.Section>
                  <Panel.SectionBody className="space-y-1 px-1.5 py-2">
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
                        >
                          <Panel.ItemLeading>
                            <Folder size={14} strokeWidth={1.75} />
                          </Panel.ItemLeading>
                          <Panel.ItemBody>
                            <EditableField
                              value={bundle.library.name}
                              onCommit={handleRename}
                              editing={isEditing}
                              className="text-md font-medium"
                            />
                          </Panel.ItemBody>
                        </Panel.Item>
                      );
                    })}
                  </Panel.SectionBody>
                </Panel.Section>
              </>
            )}

            {libraryPanelView === 'playlist' && currentLibraryBundle && (
              <>
                <Panel.Header>
                  <Button.Icon label="New library" onClick={handleBackToLibraries}>
                    <ChevronLeft />
                  </Button.Icon>
                  <Label.sm className="mr-auto pl-1">{currentLibraryBundle.library.name}</Label.sm>
                </Panel.Header>

                <SplitPanel.Panel splitId="library-panel" orientation="vertical" className="flex-1">
                  <SplitPanel.Segment id="library-playlists" defaultSize={200} minSize={120}>
                    <PlaylistList />
                  </SplitPanel.Segment>
                  <SplitPanel.Segment id="library-segments" defaultSize={320} minSize={180}>
                    <SegmentsBrowser />
                  </SplitPanel.Segment>
                </SplitPanel.Panel>
              </>
            )}

            {libraryBrowserState.menuState && (
              <ContextMenu
                x={libraryBrowserState.menuState.x}
                y={libraryBrowserState.menuState.y}
                items={libraryBrowserState.menuItems}
                onClose={libraryBrowserActions.closeMenu}
              />
            )}
          </Panel>
        </SplitPanel.Segment>
        <SplitPanel.Segment id="show-center" defaultSize={840} minSize={360}>
          <SplitPanel.Panel splitId="show-center" orientation="vertical" className="h-full">
            <SplitPanel.Segment id="show-middle" defaultSize={600} minSize={360}>
              <main data-ui-region="slide-browser" className="flex h-full min-h-0 flex-col overflow-hidden">
                <DeckBrowserToolbar items={state.items} headerVariant={state.headerVariant} />
                <section className="min-h-0 flex-1 overflow-hidden">
                  {state.contentVariant === 'empty' && (
                    <section className="flex h-full min-h-0 items-center justify-center p-6">
                      <div className="flex flex-col max-w-md items-center gap-3 rounded-lg border border-primary bg-primary/50 px-8 py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary bg-tertiary text-tertiary">
                          <LayoutTemplate />
                        </div>
                        <h2 className="m-0 text-lg font-semibold text-primary">No item selected</h2>
                        <p className="m-0 text-sm text-tertiary">Select an item from a playlist or from the deck drawer to load slides in the browser.</p>
                      </div>
                    </section>
                  )}
                  {state.contentVariant === 'single-grid' && <SlideGrid />}
                  {state.contentVariant === 'single-list' && <SlideList />}
                  {state.contentVariant === 'continuous-grid' && <ContinuousSlideGrid items={state.items} />}
                  {state.contentVariant === 'continuous-list' && <ContinuousSlideList items={state.items} />}
                </section>
              </main>
            </SplitPanel.Segment>
            <SplitPanel.Segment id="show-bottom" defaultSize={260} minSize={96} collapsible>
              <ResourceDrawer />
            </SplitPanel.Segment>
          </SplitPanel.Panel>
        </SplitPanel.Segment>
        <SplitPanel.Segment id="show-right" defaultSize={320} minSize={140} collapsible>
          <PreviewPanel />
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}
