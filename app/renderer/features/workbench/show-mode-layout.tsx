import { ResourceDrawer } from '../show/resource-drawer';
import { PreviewPanel } from '../show/preview-panel';
import { LibraryPanel } from '../show/library-panel';
import { PanelRoute } from './panel-route';
import { SlideBrowserToolbar } from '../show/slide-browser-toolbar';
import { EmptyStatePanel } from '@renderer/components/display/empty-state-panel';
import { useSlideBrowserView } from '../show/use-slide-browser-view';
import { LayoutTemplate } from 'lucide-react';
import { SlideGrid } from '../show/slide-grid';
import { SlideList } from '../show/slide-list';
import { ContinuousSlideGrid } from '../show/continuous-slide-grid';
import { ContinuousSlideList } from '../show/continuous-slide-list';

export function ShowModeLayout() {
  const state = useSlideBrowserView();

  return (
    <section data-ui-region="show-mode-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="show-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="show-left" defaultSize={300} minSize={140} collapsible>
          <LibraryPanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="show-center" defaultSize={840} minSize={360}>
          <PanelRoute.Split splitId="show-center" orientation="vertical" className="h-full">
            <PanelRoute.Panel id="show-middle" defaultSize={600} minSize={360}>
              <main data-ui-region="slide-browser" className="flex flex-col h-full min-h-0 overflow-hidden" >
                <SlideBrowserToolbar items={state.items} headerVariant={state.headerVariant} />
                <section className="min-h-0 flex-1 overflow-hidden">
                  {(state.contentVariant === 'empty') && <EmptyStatePanel glyph={<LayoutTemplate />} title="No item selected" description="Select an item from a playlist or from the deck drawer to load slides in the browser." />}
                  {(state.contentVariant === 'single-grid') && <SlideGrid />}
                  {(state.contentVariant === 'single-list') && <SlideList />}
                  {(state.contentVariant === 'continuous-grid') && <ContinuousSlideGrid items={state.items} />}
                  {(state.contentVariant === 'continuous-list') && <ContinuousSlideList items={state.items} />}
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
