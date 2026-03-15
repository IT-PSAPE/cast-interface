import { ResizableSplitRoot } from '../../../components/resizable-split';
import { InspectorPanel } from '../../inspector/components/inspector-panel';
import { WORKBENCH_SPLIT_DEFINITIONS, type WorkbenchPanelLayouts } from '../types/workbench-panel-layout';
import type { ResizeEndInput, ResizeMoveInput, ResizeStartInput } from '../hooks/use-workbench-panel-layout';
import { StagePanel } from '../../stage/components/stage-panel';
import { OverlayListPanel } from '../../overlay-editor/components/overlay-list-panel';
import { useSplitResizeHandlers } from '../hooks/use-split-resize-handlers';
import { requirePaneState } from '../utils/split-resize';

interface OverlayEditorLayoutProps {
  liveLayouts: WorkbenchPanelLayouts;
  startDrag: (input: ResizeStartInput) => void;
  updateDrag: (input: ResizeMoveInput) => void;
  endDrag: (input: ResizeEndInput) => void;
}

export function OverlayEditorLayout({ liveLayouts, startDrag, updateDrag, endDrag }: OverlayEditorLayoutProps) {
  const overlayMain = liveLayouts.overlayMain;
  const definition = WORKBENCH_SPLIT_DEFINITIONS['overlay-main'];
  const mainHandlers = useSplitResizeHandlers('overlay-main', startDrag, updateDrag, endDrag);

  return (
    <section data-ui-region="overlay-editor-layout" className="h-full min-h-0 overflow-hidden">
      <ResizableSplitRoot
        orientation="horizontal"
        className="h-full"
        panes={[
          {
            id: 'overlay-left',
            visible: requirePaneState(overlayMain, 'overlay-left').visible,
            size: requirePaneState(overlayMain, 'overlay-left').size,
            minSize: definition.panes['overlay-left']!.minSize,
            maxSize: definition.panes['overlay-left']!.maxSize,
            flexible: false,
            content: <OverlayListPanel />,
          },
          {
            id: 'overlay-center',
            visible: requirePaneState(overlayMain, 'overlay-center').visible,
            size: requirePaneState(overlayMain, 'overlay-center').size,
            minSize: definition.panes['overlay-center']!.minSize,
            maxSize: definition.panes['overlay-center']!.maxSize,
            flexible: true,
            content: <StagePanel />,
          },
          {
            id: 'overlay-right',
            visible: requirePaneState(overlayMain, 'overlay-right').visible,
            size: requirePaneState(overlayMain, 'overlay-right').size,
            minSize: definition.panes['overlay-right']!.minSize,
            maxSize: definition.panes['overlay-right']!.maxSize,
            flexible: false,
            content: <InspectorPanel />,
          },
        ]}
        onResizeStart={mainHandlers.onResizeStart}
        onResize={mainHandlers.onResize}
        onResizeEnd={mainHandlers.onResizeEnd}
      />
    </section>
  );
}
