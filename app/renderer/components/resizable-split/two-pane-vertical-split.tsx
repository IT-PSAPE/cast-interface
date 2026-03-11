import type { ReactNode } from 'react';
import { ResizableSplitRoot } from './resizable-split-root';
import { useTwoPaneVerticalSplit } from './use-two-pane-vertical-split';

interface TwoPaneVerticalSplitProps {
  topPane: ReactNode;
  bottomPane: ReactNode;
  className?: string;
  topPaneId?: string;
  bottomPaneId?: string;
  defaultTopSize: number;
  defaultBottomSize: number;
  minTopSize: number;
  minBottomSize: number;
}

export function TwoPaneVerticalSplit({
  topPane,
  bottomPane,
  className = '',
  topPaneId = 'top-pane',
  bottomPaneId = 'bottom-pane',
  defaultTopSize,
  defaultBottomSize,
  minTopSize,
  minBottomSize,
}: TwoPaneVerticalSplitProps) {
  const {
    topSize,
    bottomSize,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
  } = useTwoPaneVerticalSplit({
    topPaneId,
    bottomPaneId,
    defaultTopSize,
    defaultBottomSize,
    minTopSize,
    minBottomSize,
  });

  return (
    <ResizableSplitRoot
      orientation="vertical"
      className={className}
      panes={[
        {
          id: topPaneId,
          visible: true,
          size: topSize,
          minSize: minTopSize,
          maxSize: Number.POSITIVE_INFINITY,
          flexible: false,
          content: topPane,
        },
        {
          id: bottomPaneId,
          visible: true,
          size: bottomSize,
          minSize: minBottomSize,
          maxSize: Number.POSITIVE_INFINITY,
          flexible: true,
          content: bottomPane,
        },
      ]}
      onResizeStart={handleResizeStart}
      onResize={handleResize}
      onResizeEnd={handleResizeEnd}
    />
  );
}
