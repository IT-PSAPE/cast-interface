import { InspectorPanel } from '../../inspector/components/inspector-panel';
import { StagePanel } from '../../stage/components/stage-panel';
import { SlideNotesPanel } from '../../editor/components/slide-notes-panel';
import { SlideListPanel } from '../../editor/components/slide-list-panel';
import { PanelRoute } from './panel-route';

export function SlideEditorLayout() {
  return (
    <section data-ui-region="slide-editor-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="edit-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="edit-left" defaultSize={280} minSize={140} collapsible>
          <SlideListPanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="edit-center" defaultSize={840} minSize={360}>
          <PanelRoute.Split splitId="edit-center" orientation="vertical" className="h-full">
            <PanelRoute.Panel id="edit-middle" defaultSize={620} minSize={240}>
              <StagePanel />
            </PanelRoute.Panel>
            <PanelRoute.Panel id="edit-bottom" defaultSize={220} minSize={120} collapsible>
              <SlideNotesPanel />
            </PanelRoute.Panel>
          </PanelRoute.Split>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="edit-right" defaultSize={320} minSize={140} collapsible>
          <InspectorPanel />
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </section>
  );
}
