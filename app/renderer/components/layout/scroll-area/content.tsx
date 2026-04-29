import { forwardRef, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { useScrollAreaRootContext, useScrollAreaViewportContext } from './context';
import { mergeRefs, useIsoLayoutEffect } from './utils';

export interface ScrollAreaContentProps extends HTMLAttributes<HTMLDivElement> {}

export const ScrollAreaContent = forwardRef<HTMLDivElement, ScrollAreaContentProps>(function ScrollAreaContent(
  { className, style, children, ...elementProps },
  forwardedRef,
) {
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const { computeThumbPosition } = useScrollAreaViewportContext();
  const { viewportState } = useScrollAreaRootContext();

  useIsoLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    let hasInitialized = false;
    const ro = new ResizeObserver(() => {
      // First delivery fires on observe; skip it to avoid double-computing on mount.
      if (!hasInitialized) {
        hasInitialized = true;
        return;
      }
      computeThumbPosition();
    });
    if (contentWrapperRef.current) ro.observe(contentWrapperRef.current);
    return () => ro.disconnect();
  }, [computeThumbPosition]);

  const baseStyle: CSSProperties = {
    minWidth: 'fit-content',
    ...style,
  };

  return (
    <div
      {...elementProps}
      ref={mergeRefs(forwardedRef, contentWrapperRef)}
      role="presentation"
      className={className}
      style={baseStyle}
      data-scrolling={viewportState.scrolling ? '' : undefined}
      data-has-overflow-x={viewportState.hasOverflowX ? '' : undefined}
      data-has-overflow-y={viewportState.hasOverflowY ? '' : undefined}
      data-overflow-x-start={viewportState.overflowXStart ? '' : undefined}
      data-overflow-x-end={viewportState.overflowXEnd ? '' : undefined}
      data-overflow-y-start={viewportState.overflowYStart ? '' : undefined}
      data-overflow-y-end={viewportState.overflowYEnd ? '' : undefined}
    >
      {children}
    </div>
  );
});
