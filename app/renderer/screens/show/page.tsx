import { LayoutTemplate } from 'lucide-react';
import { ResourceDrawer } from '../../features/workbench/resource-drawer';
import { ContinuousSlideBrowser } from '../../features/deck/continuous-slide-browser';
import { LibraryBrowserProvider } from '../../features/library/library-browser-context';
import { PreviewPanel } from '../../features/playback/preview-panel';
import { DeckBrowserToolbar } from '../../features/deck/deck-browser-toolbar';
import { SlideBrowserContent } from '../../features/deck/slide-browser-content';
import { useDeckBrowserView } from '../../features/deck/use-deck-browser-view';
import { SplitPanel } from '../../features/workbench/split-panel';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { useLibraryPanelState } from '@renderer/features/library/library-panel-context';
import { LibrariesPanel } from '@renderer/features/library/libraries-panel';
import { PlaylistPanels } from '@renderer/features/library/playlist-panels';

export function ShowScreen() {
  return (
    <LibraryBrowserProvider>
      <ShowScreenContent />
    </LibraryBrowserProvider>
  );
}

function ShowScreenContent() {
  const state = useDeckBrowserView();
  const { currentLibraryBundle } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();

  return (
    <section data-ui-region="show-mode-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="show-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="show-left" defaultSize={300} minSize={140} collapsible>
          {libraryPanelView === 'libraries' ? <LibrariesPanel /> : null}
          {libraryPanelView === 'playlist' && currentLibraryBundle ? <PlaylistPanels /> : null}
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
                  <SlideBrowserContent variant={state.contentVariant} />
                  <ContinuousSlideBrowser variant={state.contentVariant} items={state.items} />
                </section>
              </main>
            </SplitPanel.Segment>
            <SplitPanel.Segment id="show-bottom" defaultSize={260} minSize={96} collapsible>
              <ResourceDrawer />
            </SplitPanel.Segment>
          </SplitPanel.Panel>
        </SplitPanel.Segment>
        <SplitPanel.Segment id="show-right" defaultSize={320} minSize={140} maxSize={360} collapsible>
          <PreviewPanel />
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}
