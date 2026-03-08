import type { PointerEventHandler } from 'react';

const TOUCH_SIZE = 16;
const HALF_TOUCH_SIZE = TOUCH_SIZE / 2;

interface ResizableSplitHandleProps {
  orientation: 'horizontal' | 'vertical';
  handleIndex: number;
  position: number;
  active: boolean;
  hovered: boolean;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
  onPointerEnter: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
}

export function ResizableSplitHandle({
  orientation,
  handleIndex,
  position,
  active,
  hovered,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerEnter,
  onPointerLeave,
}: ResizableSplitHandleProps) {
  const isHorizontal = orientation === 'horizontal';
  const touchClass = isHorizontal
    ? 'absolute top-0 bottom-0 w-4 cursor-ew-resize'
    : 'absolute left-0 right-0 h-4 cursor-ns-resize';

  const highlightClass = active || hovered ? 'bg-brand-400' : 'bg-transparent';
  const lineClass = isHorizontal
    ? `pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 transition-colors ${highlightClass}`
    : `pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 transition-colors ${highlightClass}`;

  const style = isHorizontal
    ? { left: `${position - HALF_TOUCH_SIZE}px` }
    : { top: `${position - HALF_TOUCH_SIZE}px` };

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      data-handle-index={handleIndex}
      className={`${touchClass} z-20 touch-none`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className={lineClass} />
    </div>
  );
}

export type { ResizableSplitHandleProps };
