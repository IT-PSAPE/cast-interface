import { ResourceDrawer } from '../../features/workbench/resource-drawer';
import { ContinuousSlideBrowser } from '../../features/deck/continuous-slide-browser';
import { LibraryBrowserProvider } from '../../features/library/library-browser-context';
import { PreviewPanel } from '../../features/playback/preview-panel';
import { DeckBrowserToolbar } from '../../features/deck/deck-browser-toolbar';
import { SlideBrowserContent } from '../../features/deck/slide-browser-content';
import { useDeckBrowserView } from '../../features/deck/use-deck-browser-view';
import { SplitPanel } from '../../features/workbench/split-panel';
import { LibrariesPanel } from '@renderer/features/library/libraries-panel';
import { PlaylistPanels } from '@renderer/features/library/playlist-panels';
import { Logo } from '@renderer/components/assets';

export function ShowScreen() {
  return (
    <LibraryBrowserProvider>
      <ShowScreenContent />
    </LibraryBrowserProvider>
  );
}

function ShowScreenContent() {
  const state = useDeckBrowserView();

  return (
    <SplitPanel.Panel splitId="show-main" orientation="horizontal" className="h-full">
      <SplitPanel.Segment id="show-left" defaultSize={300} minSize={140} collapsible>
        <LibrariesPanel />
        <PlaylistPanels />
      </SplitPanel.Segment>
      <SplitPanel.Segment id="show-center" defaultSize={840} minSize={360}>
        <SplitPanel.Panel splitId="show-center" orientation="vertical" className="h-full">
          <SplitPanel.Segment id="show-middle" defaultSize={600} minSize={360}>
            <DeckBrowserToolbar items={state.items} headerVariant={state.headerVariant} />
            {state.contentVariant === 'empty' && (
              <div className="flex h-full min-h-0 items-center justify-center p-2">
                <Logo className='size-60 opacity-10' />
              </div>
            )}
            <SlideBrowserContent variant={state.contentVariant} />
            <ContinuousSlideBrowser variant={state.contentVariant} items={state.items} />
          </SplitPanel.Segment>
          <SplitPanel.Segment id="show-bottom" defaultSize={260} minSize={96} collapsible>
            <ResourceDrawer.Root>
              <ResourceDrawer.Header />
              <ResourceDrawer.Body />
            </ResourceDrawer.Root>
          </SplitPanel.Segment>
        </SplitPanel.Panel>
      </SplitPanel.Segment>
      <SplitPanel.Segment id="show-right" defaultSize={320} minSize={140} maxSize={360} collapsible>
        <PreviewPanel />
      </SplitPanel.Segment>
    </SplitPanel.Panel>
  );
}
