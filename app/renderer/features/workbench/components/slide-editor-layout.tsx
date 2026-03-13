import { ResizableSplitRoot } from '../../../components/resizable-split';
import { InspectorPanel } from '../../inspector/components/inspector-panel';
import { WORKBENCH_SPLIT_DEFINITIONS, type WorkbenchPanelLayouts } from '../types/workbench-panel-layout';
import type { ResizeEndInput, ResizeMoveInput, ResizeStartInput } from '../hooks/use-workbench-panel-layout';
import { StagePanel } from '../../stage/components/stage-panel';
import { SlideNotesPanel } from '../../slide-editor/components/slide-notes-panel';
import { SlideListPanel } from '../../slide-editor/components/slide-list-panel';
import { useSplitResizeHandlers } from '../hooks/use-split-resize-handlers';
import { requirePaneState } from '../utils/split-resize';

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
  const mainHandlers = useSplitResizeHandlers('edit-main', startDrag, updateDrag, endDrag);
  const centerHandlers = useSplitResizeHandlers('edit-center', startDrag, updateDrag, endDrag);

  return (
    <section data-ui-region="slide-editor-layout" className="h-full min-h-0 overflow-hidden">
      <ResizableSplitRoot
        orientation="horizontal"
        className="h-full"
        panes={[
          {
            id: 'edit-left',
            visible: requirePaneState(editMain, 'edit-left').visible,
            size: requirePaneState(editMain, 'edit-left').size,
            minSize: definition.panes['edit-left']!.minSize,
            maxSize: definition.panes['edit-left']!.maxSize,
            flexible: false,
            content: <SlideListPanel />,
          },
          {
            id: 'edit-center',
            visible: requirePaneState(editMain, 'edit-center').visible,
            size: requirePaneState(editMain, 'edit-center').size,
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
                    visible: requirePaneState(editCenter, 'edit-middle').visible,
                    size: requirePaneState(editCenter, 'edit-middle').size,
                    minSize: centerDefinition.panes['edit-middle']!.minSize,
                    maxSize: centerDefinition.panes['edit-middle']!.maxSize,
                    flexible: true,
                    content: <StagePanel />,
                  },
                  {
                    id: 'edit-bottom',
                    visible: requirePaneState(editCenter, 'edit-bottom').visible,
                    size: requirePaneState(editCenter, 'edit-bottom').size,
                    minSize: centerDefinition.panes['edit-bottom']!.minSize,
                    maxSize: centerDefinition.panes['edit-bottom']!.maxSize,
                    flexible: false,
                    content: <SlideNotesPanel />,
                  },
                ]}
                onResizeStart={centerHandlers.onResizeStart}
                onResize={centerHandlers.onResize}
                onResizeEnd={centerHandlers.onResizeEnd}
              />
            ),
          },
          {
            id: 'edit-right',
            visible: requirePaneState(editMain, 'edit-right').visible,
            size: requirePaneState(editMain, 'edit-right').size,
            minSize: definition.panes['edit-right']!.minSize,
            maxSize: definition.panes['edit-right']!.maxSize,
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
