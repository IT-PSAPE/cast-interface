import { ResizableSplitRoot, type ResizableSplitResizeEndEvent, type ResizableSplitResizeMoveEvent, type ResizableSplitResizeStartEvent } from '../../../components/resizable-split';
import { InspectorRail } from '../../inspector/components/inspector-rail';
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
import { EditCanvasPanel } from './edit-canvas-panel';
import { EditSlideListPanel } from './edit-slide-list-panel';

interface EditViewLayoutProps {
  liveLayouts: WorkbenchPanelLayouts;
  startDrag: (input: ResizeStartInput) => void;
  updateDrag: (input: ResizeMoveInput) => void;
  endDrag: (input: ResizeEndInput) => void;
}

export function EditViewLayout({ liveLayouts, startDrag, updateDrag, endDrag }: EditViewLayoutProps) {
  const editMain = liveLayouts.editMain;
  const definition = WORKBENCH_SPLIT_DEFINITIONS['edit-main'];

  function handleEditResizeStart(event: ResizableSplitResizeStartEvent) {
    startDrag({
      splitId: 'edit-main',
      handleIndex: event.handleIndex,
      pointerPosition: event.pointerPosition,
      paneSizes: event.paneSizes,
    });
  }

  function handleEditResize(event: ResizableSplitResizeMoveEvent) {
    updateDrag({
      splitId: 'edit-main',
      pointerPosition: event.pointerPosition,
    });
  }

  function handleEditResizeEnd(_event: ResizableSplitResizeEndEvent) {
    endDrag({ splitId: 'edit-main' });
  }

  return (
    <section className="h-full min-h-0 overflow-hidden">
      <ResizableSplitRoot
        orientation="horizontal"
        className="h-full"
        panes={[
          {
            id: 'edit-left',
            visible: requirePane(editMain, 'edit-left').visible,
            size: requirePane(editMain, 'edit-left').size,
            minSize: definition.panes['edit-left']!.minSize,
            maxSize: definition.panes['edit-left']!.maxSize,
            flexible: false,
            content: <EditSlideListPanel />,
          },
          {
            id: 'edit-center',
            visible: requirePane(editMain, 'edit-center').visible,
            size: requirePane(editMain, 'edit-center').size,
            minSize: definition.panes['edit-center']!.minSize,
            maxSize: definition.panes['edit-center']!.maxSize,
            flexible: true,
            content: <EditCanvasPanel />,
          },
          {
            id: 'edit-right',
            visible: requirePane(editMain, 'edit-right').visible,
            size: requirePane(editMain, 'edit-right').size,
            minSize: definition.panes['edit-right']!.minSize,
            maxSize: definition.panes['edit-right']!.maxSize,
            flexible: false,
            content: <InspectorRail />,
          },
        ]}
        onResizeStart={handleEditResizeStart}
        onResize={handleEditResize}
        onResizeEnd={handleEditResizeEnd}
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
