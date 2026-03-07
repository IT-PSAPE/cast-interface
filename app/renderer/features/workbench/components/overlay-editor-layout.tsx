import { ResizableSplitRoot, type ResizableSplitResizeEndEvent, type ResizableSplitResizeMoveEvent, type ResizableSplitResizeStartEvent } from '../../../components/resizable-split';
import { InspectorPanel } from '../../inspector/components/inspector-panel';
import {
  WORKBENCH_SPLIT_DEFINITIONS,
  type PaneId,
  type SplitLayoutState,
  type WorkbenchPanelLayouts,
} from '../types/workbench-panel-layout';
import type {
  ResizeEndInput,
  ResizeMoveInput,
  ResizeStartInput,
} from '../hooks/use-workbench-panel-layout';
import { StagePanel } from '../../stage/components/stage-panel';
import { OverlayListPanel } from '../../overlay-editor/components/overlay-list-panel';

interface OverlayEditorLayoutProps {
  liveLayouts: WorkbenchPanelLayouts;
  startDrag: (input: ResizeStartInput) => void;
  updateDrag: (input: ResizeMoveInput) => void;
  endDrag: (input: ResizeEndInput) => void;
}

export function OverlayEditorLayout({ liveLayouts, startDrag, updateDrag, endDrag }: OverlayEditorLayoutProps) {
  const overlayMain = liveLayouts.overlayMain;
  const definition = WORKBENCH_SPLIT_DEFINITIONS['overlay-main'];

  function handleOverlayResizeStart(event: ResizableSplitResizeStartEvent) {
    startDrag({
      splitId: 'overlay-main',
      handleIndex: event.handleIndex,
      pointerPosition: event.pointerPosition,
      paneSizes: event.paneSizes,
    });
  }

  function handleOverlayResize(event: ResizableSplitResizeMoveEvent) {
    updateDrag({
      splitId: 'overlay-main',
      pointerPosition: event.pointerPosition,
    });
  }

  function handleOverlayResizeEnd(_event: ResizableSplitResizeEndEvent) {
    endDrag({ splitId: 'overlay-main' });
  }

  return (
    <section className="h-full min-h-0 overflow-hidden">
      <ResizableSplitRoot
        orientation="horizontal"
        className="h-full"
        panes={[
          {
            id: 'overlay-left',
            visible: requirePane(overlayMain, 'overlay-left').visible,
            size: requirePane(overlayMain, 'overlay-left').size,
            minSize: definition.panes['overlay-left']!.minSize,
            maxSize: definition.panes['overlay-left']!.maxSize,
            flexible: false,
            content: <OverlayListPanel />,
          },
          {
            id: 'overlay-center',
            visible: requirePane(overlayMain, 'overlay-center').visible,
            size: requirePane(overlayMain, 'overlay-center').size,
            minSize: definition.panes['overlay-center']!.minSize,
            maxSize: definition.panes['overlay-center']!.maxSize,
            flexible: true,
            content: <StagePanel />,
          },
          {
            id: 'overlay-right',
            visible: requirePane(overlayMain, 'overlay-right').visible,
            size: requirePane(overlayMain, 'overlay-right').size,
            minSize: definition.panes['overlay-right']!.minSize,
            maxSize: definition.panes['overlay-right']!.maxSize,
            flexible: false,
            content: <InspectorPanel />,
          },
        ]}
        onResizeStart={handleOverlayResizeStart}
        onResize={handleOverlayResize}
        onResizeEnd={handleOverlayResizeEnd}
      />
    </section>
  );
}

function requirePane(layout: SplitLayoutState, paneId: PaneId) {
  const pane = layout.panes[paneId];
  if (!pane) {
    throw new Error(`Missing pane layout for ${paneId}`);
  }
  return pane;
}
