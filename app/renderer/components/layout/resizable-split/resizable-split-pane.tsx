import type { CSSProperties, ReactNode } from 'react';

interface ResizableSplitPaneProps {
  paneId: string;
  orientation: 'horizontal' | 'vertical';
  size: number;
  minSize: number;
  maxSize: number;
  flexible: boolean;
  visible: boolean;
  className?: string;
  children: ReactNode;
}

export function ResizableSplitPane({ paneId, orientation, size, minSize, maxSize, flexible, visible, className = '', children }: ResizableSplitPaneProps) {
  if (!visible) return null;

  const style = buildPaneStyle(orientation, size, minSize, maxSize, flexible);
  return (
    <section data-pane-id={paneId} className={`h-full min-h-0 min-w-0 overflow-hidden ${className}`.trim()} style={style}>
      {children}
    </section>
  );
}

function buildPaneStyle(
  orientation: 'horizontal' | 'vertical',
  size: number,
  minSize: number,
  maxSize: number,
  flexible: boolean,
): CSSProperties {
  const style: CSSProperties = {};
  const isHorizontal = orientation === 'horizontal';

  if (isHorizontal) {
    style.minWidth = `${minSize}px`;
    if (Number.isFinite(maxSize)) style.maxWidth = `${maxSize}px`;

    if (flexible) {
      style.flexGrow = 1;
      style.flexShrink = 1;
      style.flexBasis = `${size}px`;
      return style;
    }

    style.flexGrow = 0;
    style.flexShrink = 1;
    style.flexBasis = `${size}px`;
    return style;
  }

  style.minHeight = `${minSize}px`;
  if (Number.isFinite(maxSize)) style.maxHeight = `${maxSize}px`;

  if (flexible) {
    style.flexGrow = 1;
    style.flexShrink = 1;
    style.flexBasis = `${size}px`;
    return style;
  }

  style.flexGrow = 0;
  style.flexShrink = 1;
  style.flexBasis = `${size}px`;
  return style;
}

export type { ResizableSplitPaneProps };
