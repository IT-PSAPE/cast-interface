import { ResizableSplitRoot } from '../../../components/resizable-split';
import { ResourceDrawer } from '../../resource-drawer/components/resource-drawer';
import { PreviewPanel } from '../../outputs/components/preview-panel';
import { LibraryPanel } from '../../library-browser/components/library-panel';
import { WORKBENCH_SPLIT_DEFINITIONS, type WorkbenchPanelLayouts } from '../types/workbench-panel-layout';
import type { ResizeEndInput, ResizeMoveInput, ResizeStartInput } from '../hooks/use-workbench-panel-layout';
import { SlideBrowser } from '../../slide-browser/components/slide-browser';
import { useSplitResizeHandlers } from '../hooks/use-split-resize-handlers';
import { requirePaneState } from '../utils/split-resize';

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
  const mainHandlers = useSplitResizeHandlers('show-main', startDrag, updateDrag, endDrag);
  const centerHandlers = useSplitResizeHandlers('show-center', startDrag, updateDrag, endDrag);

  return (
    <section data-ui-region="show-mode-layout" className="h-full min-h-0 overflow-hidden">
      <ResizableSplitRoot
        orientation="horizontal"
        className="h-full"
        panes={[
          {
            id: 'show-left',
            visible: requirePaneState(showMain, 'show-left').visible,
            size: requirePaneState(showMain, 'show-left').size,
            minSize: showMainDefinition.panes['show-left']!.minSize,
            maxSize: showMainDefinition.panes['show-left']!.maxSize,
            flexible: false,
            content: <LibraryPanel />,
          },
          {
            id: 'show-center',
            visible: requirePaneState(showMain, 'show-center').visible,
            size: requirePaneState(showMain, 'show-center').size,
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
                    visible: requirePaneState(showCenter, 'show-middle').visible,
                    size: requirePaneState(showCenter, 'show-middle').size,
                    minSize: showCenterDefinition.panes['show-middle']!.minSize,
                    maxSize: showCenterDefinition.panes['show-middle']!.maxSize,
                    flexible: true,
                    content: <SlideBrowser />,
                  },
                  {
                    id: 'show-bottom',
                    visible: requirePaneState(showCenter, 'show-bottom').visible,
                    size: requirePaneState(showCenter, 'show-bottom').size,
                    minSize: showCenterDefinition.panes['show-bottom']!.minSize,
                    maxSize: showCenterDefinition.panes['show-bottom']!.maxSize,
                    flexible: false,
                    content: <ResourceDrawer />,
                  },
                ]}
                onResizeStart={centerHandlers.onResizeStart}
                onResize={centerHandlers.onResize}
                onResizeEnd={centerHandlers.onResizeEnd}
              />
            ),
          },
          {
            id: 'show-right',
            visible: requirePaneState(showMain, 'show-right').visible,
            size: requirePaneState(showMain, 'show-right').size,
            minSize: showMainDefinition.panes['show-right']!.minSize,
            maxSize: showMainDefinition.panes['show-right']!.maxSize,
            flexible: false,
            content: <PreviewPanel />,
          },
        ]}
        onResizeStart={mainHandlers.onResizeStart}
        onResize={mainHandlers.onResize}
        onResizeEnd={mainHandlers.onResizeEnd}
      />
    </section>
  );
}
