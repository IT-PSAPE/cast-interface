import type { ReactNode } from 'react';
import { InspectorPanel } from '../inspector/inspector-panel';
import { StagePanel } from '../stage/stage-panel';
import { PanelRoute } from './panel-route';

interface EditorLayoutProps {
  leftPanel: ReactNode;
}

export function EditorLayout({ leftPanel }: EditorLayoutProps) {
  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="editor-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="editor-left" defaultSize={280} minSize={140} collapsible>
          {leftPanel}
        </PanelRoute.Panel>
        <PanelRoute.Panel id="editor-center" defaultSize={840} minSize={360}>
          <StagePanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="editor-right" defaultSize={320} minSize={140} collapsible>
          <InspectorPanel />
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </section>
  );
}
