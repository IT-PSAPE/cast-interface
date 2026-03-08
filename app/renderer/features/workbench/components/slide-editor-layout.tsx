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
import { SlideNotesPanel } from '../../slide-editor/components/slide-notes-panel';
import { SlideListPanel } from '../../slide-editor/components/slide-list-panel';

interface SlideEditorLayoutProps {
  liveLayouts: WorkbenchPanelLayouts;
  startDrag: (input: ResizeStartInput) => void;
  updateDrag: (input: ResizeMoveInput) => void;
  endDrag: (input: ResizeEndInput) => void;
}

export function SlideEditorLayout({ liveLayouts, startDrag, updateDrag, endDrag }: SlideEditorLayoutProps) {
  const editMain = liveLayouts.editMain;
  const editCenter = liveLayouts.editCenter;
  const definition = WORKBENCH_SPLIT_DEFINITIONS['edit-main'];
  const centerDefinition = WORKBENCH_SPLIT_DEFINITIONS['edit-center'];

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

  function handleEditCenterResizeStart(event: ResizableSplitResizeStartEvent) {
    startDrag({
      splitId: 'edit-center',
      handleIndex: event.handleIndex,
      pointerPosition: event.pointerPosition,
      paneSizes: event.paneSizes,
    });
  }

  function handleEditCenterResize(event: ResizableSplitResizeMoveEvent) {
    updateDrag({
      splitId: 'edit-center',
      pointerPosition: event.pointerPosition,
    });
  }

  function handleEditCenterResizeEnd(_event: ResizableSplitResizeEndEvent) {
    endDrag({ splitId: 'edit-center' });
  }

  return (
    <section data-ui-region="slide-editor-layout" className="h-full min-h-0 overflow-hidden">
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
            content: <SlideListPanel />,
          },
          {
            id: 'edit-center',
            visible: requirePane(editMain, 'edit-center').visible,
            size: requirePane(editMain, 'edit-center').size,
            minSize: definition.panes['edit-center']!.minSize,
            maxSize: definition.panes['edit-center']!.maxSize,
            flexible: true,
            content: (
              <ResizableSplitRoot
                orientation="vertical"
                className="h-full"
                panes={[
                  {
                    id: 'edit-middle',
                    visible: requirePane(editCenter, 'edit-middle').visible,
                    size: requirePane(editCenter, 'edit-middle').size,
                    minSize: centerDefinition.panes['edit-middle']!.minSize,
                    maxSize: centerDefinition.panes['edit-middle']!.maxSize,
                    flexible: true,
                    content: <StagePanel />,
                  },
                  {
                    id: 'edit-bottom',
                    visible: requirePane(editCenter, 'edit-bottom').visible,
                    size: requirePane(editCenter, 'edit-bottom').size,
                    minSize: centerDefinition.panes['edit-bottom']!.minSize,
                    maxSize: centerDefinition.panes['edit-bottom']!.maxSize,
                    flexible: false,
                    content: <SlideNotesPanel />,
                  },
                ]}
                onResizeStart={handleEditCenterResizeStart}
                onResize={handleEditCenterResize}
                onResizeEnd={handleEditCenterResizeEnd}
              />
            ),
          },
          {
            id: 'edit-right',
            visible: requirePane(editMain, 'edit-right').visible,
            size: requirePane(editMain, 'edit-right').size,
            minSize: definition.panes['edit-right']!.minSize,
            maxSize: definition.panes['edit-right']!.maxSize,
            flexible: false,
            content: <InspectorPanel />,
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
