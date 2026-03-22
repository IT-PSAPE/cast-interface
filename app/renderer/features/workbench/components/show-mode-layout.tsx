import { ResourceDrawer } from '../../resource-drawer/components/resource-drawer';
import { PreviewPanel } from '../../outputs/components/preview-panel';
import { LibraryPanel } from '../../library-browser/components/library-panel';
import { SlideBrowser } from '../../slide-browser/components/slide-browser';
import { PanelRoute } from './panel-route';

export function ShowModeLayout() {
  return (
    <section data-ui-region="show-mode-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="show-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="show-left" defaultSize={300} minSize={140} collapsible>
          <LibraryPanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="show-center" defaultSize={840} minSize={360}>
          <PanelRoute.Split splitId="show-center" orientation="vertical" className="h-full">
            <PanelRoute.Panel id="show-middle" defaultSize={600} minSize={360}>
              <SlideBrowser />
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
