import { InspectorPanel } from '../../inspector/components/inspector-panel';
import { StagePanel } from '../../stage/components/stage-panel';
import { OverlayListPanel } from '../../overlay-editor/components/overlay-list-panel';
import { PanelRoute } from './panel-route';

export function OverlayEditorLayout() {
  return (
    <section data-ui-region="overlay-editor-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="overlay-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="overlay-left" defaultSize={280} minSize={140} collapsible>
          <OverlayListPanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="overlay-center" defaultSize={840} minSize={360}>
          <StagePanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="overlay-right" defaultSize={320} minSize={140} collapsible>
          <InspectorPanel />
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </section>
  );
}
