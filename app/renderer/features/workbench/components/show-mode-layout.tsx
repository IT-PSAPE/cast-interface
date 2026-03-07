import { ResizableSplitRoot, type ResizableSplitResizeEndEvent, type ResizableSplitResizeMoveEvent, type ResizableSplitResizeStartEvent } from '../../../components/resizable-split';
import { ResourceDrawer } from '../../resource-drawer/components/resource-drawer';
import { PreviewPanel } from '../../outputs/components/preview-panel';
import { LibraryPanel } from '../../library-browser/components/library-panel';
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
import { SlideBrowser } from '../../slide-browser/components/slide-browser';

interface ShowModeLayoutProps {
  liveLayouts: WorkbenchPanelLayouts;
  startDrag: (input: ResizeStartInput) => void;
  updateDrag: (input: ResizeMoveInput) => void;
  endDrag: (input: ResizeEndInput) => void;
}

export function ShowModeLayout({ liveLayouts, startDrag, updateDrag, endDrag }: ShowModeLayoutProps) {
  const showMain = liveLayouts.showMain;
  const showCenter = liveLayouts.showCenter;

  const showMainDefinition = WORKBENCH_SPLIT_DEFINITIONS['show-main'];
  const showCenterDefinition = WORKBENCH_SPLIT_DEFINITIONS['show-center'];

  function handleShowMainResizeStart(event: ResizableSplitResizeStartEvent) {
    startDrag({
      splitId: 'show-main',
      handleIndex: event.handleIndex,
      pointerPosition: event.pointerPosition,
      paneSizes: event.paneSizes,
    });
  }

  function handleShowMainResize(event: ResizableSplitResizeMoveEvent) {
    updateDrag({
      splitId: 'show-main',
      pointerPosition: event.pointerPosition,
    });
  }

  function handleShowMainResizeEnd(_event: ResizableSplitResizeEndEvent) {
    endDrag({ splitId: 'show-main' });
  }

  function handleShowCenterResizeStart(event: ResizableSplitResizeStartEvent) {
    startDrag({
      splitId: 'show-center',
      handleIndex: event.handleIndex,
      pointerPosition: event.pointerPosition,
      paneSizes: event.paneSizes,
    });
  }

  function handleShowCenterResize(event: ResizableSplitResizeMoveEvent) {
    updateDrag({
      splitId: 'show-center',
      pointerPosition: event.pointerPosition,
    });
  }

  function handleShowCenterResizeEnd(_event: ResizableSplitResizeEndEvent) {
    endDrag({ splitId: 'show-center' });
  }

  return (
    <section className="h-full min-h-0 overflow-hidden">
      <ResizableSplitRoot
        orientation="horizontal"
        className="h-full"
        panes={[
          {
            id: 'show-left',
            visible: requirePane(showMain, 'show-left').visible,
            size: requirePane(showMain, 'show-left').size,
            minSize: showMainDefinition.panes['show-left']!.minSize,
            maxSize: showMainDefinition.panes['show-left']!.maxSize,
            flexible: false,
            content: <LibraryPanel />,
          },
          {
            id: 'show-center',
            visible: requirePane(showMain, 'show-center').visible,
            size: requirePane(showMain, 'show-center').size,
            minSize: showMainDefinition.panes['show-center']!.minSize,
            maxSize: showMainDefinition.panes['show-center']!.maxSize,
            flexible: true,
            content: (
              <ResizableSplitRoot
                orientation="vertical"
                className="h-full"
                panes={[
                  {
                    id: 'show-middle',
                    visible: requirePane(showCenter, 'show-middle').visible,
                    size: requirePane(showCenter, 'show-middle').size,
                    minSize: showCenterDefinition.panes['show-middle']!.minSize,
                    maxSize: showCenterDefinition.panes['show-middle']!.maxSize,
                    flexible: true,
                    content: <SlideBrowser />,
                  },
                  {
                    id: 'show-bottom',
                    visible: requirePane(showCenter, 'show-bottom').visible,
                    size: requirePane(showCenter, 'show-bottom').size,
                    minSize: showCenterDefinition.panes['show-bottom']!.minSize,
                    maxSize: showCenterDefinition.panes['show-bottom']!.maxSize,
                    flexible: false,
                    content: <ResourceDrawer />,
                  },
                ]}
                onResizeStart={handleShowCenterResizeStart}
                onResize={handleShowCenterResize}
                onResizeEnd={handleShowCenterResizeEnd}
              />
            ),
          },
          {
            id: 'show-right',
            visible: requirePane(showMain, 'show-right').visible,
            size: requirePane(showMain, 'show-right').size,
            minSize: showMainDefinition.panes['show-right']!.minSize,
            maxSize: showMainDefinition.panes['show-right']!.maxSize,
            flexible: false,
            content: <PreviewPanel />,
          },
        ]}
        onResizeStart={handleShowMainResizeStart}
        onResize={handleShowMainResize}
        onResizeEnd={handleShowMainResizeEnd}
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
