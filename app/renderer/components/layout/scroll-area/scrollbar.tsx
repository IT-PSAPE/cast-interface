import { forwardRef, useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@renderer/utils/cn';
import {
  ScrollAreaScrollbarContext,
  useScrollAreaRootContext,
  type ScrollAreaScrollbarContextValue,
} from './context';
import { contains, getOffset, mergeRefs } from './utils';

export interface ScrollAreaScrollbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Which axis the scrollbar controls. */
  orientation?: 'vertical' | 'horizontal';
  /** Keep the element mounted when the viewport isn't scrollable. */
  keepMounted?: boolean;
}

export const ScrollAreaScrollbar = forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(function ScrollAreaScrollbar(
  { className, orientation = 'vertical', keepMounted = false, style, children, onPointerDown, onPointerUp, ...elementProps },
  forwardedRef,
) {
  const {
    hovering,
    scrollingX,
    scrollingY,
    hiddenState,
    overflowEdges,
    scrollbarYRef,
    scrollbarXRef,
    viewportRef,
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerUp,
    rootId,
    thumbSize,
    hasMeasuredScrollbar,
  } = useScrollAreaRootContext();

  const scrolling = orientation === 'vertical' ? scrollingY : scrollingX;
  const hideTrackUntilMeasured = !hasMeasuredScrollbar && !keepMounted;

  // Forward wheel events from the scrollbar track to the viewport, preventing native page scroll.
  useEffect(() => {
    const viewportEl = viewportRef.current;
    const scrollbarEl = orientation === 'vertical' ? scrollbarYRef.current : scrollbarXRef.current;
    if (!scrollbarEl) return undefined;

    function handleWheel(event: WheelEvent) {
      if (!viewportEl || !scrollbarEl || event.ctrlKey) return;
      event.preventDefault();

      if (orientation === 'vertical') {
        if (viewportEl.scrollTop === 0 && event.deltaY < 0) return;
        if (
          viewportEl.scrollTop === viewportEl.scrollHeight - viewportEl.clientHeight
          && event.deltaY > 0
        ) return;
        viewportEl.scrollTop += event.deltaY;
      } else {
        if (viewportEl.scrollLeft === 0 && event.deltaX < 0) return;
        if (
          viewportEl.scrollLeft === viewportEl.scrollWidth - viewportEl.clientWidth
          && event.deltaX > 0
        ) return;
        viewportEl.scrollLeft += event.deltaX;
      }
    }

    scrollbarEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollbarEl.removeEventListener('wheel', handleWheel);
  }, [orientation, scrollbarXRef, scrollbarYRef, viewportRef]);

  const contextValue: ScrollAreaScrollbarContextValue = useMemo(() => ({ orientation }), [orientation]);

  const isHidden = orientation === 'vertical' ? hiddenState.y : hiddenState.x;
  if (!keepMounted && isHidden) return null;

  const baseStyle: CSSProperties = {
    position: 'absolute',
    touchAction: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    visibility: hideTrackUntilMeasured ? 'hidden' : undefined,
    ...(orientation === 'vertical'
      ? {
          top: 0,
          bottom: 'var(--scroll-area-corner-height)',
          insetInlineEnd: 0,
          ['--scroll-area-thumb-height' as string]: `${thumbSize.height}px`,
        }
      : {
          insetInlineStart: 0,
          insetInlineEnd: 'var(--scroll-area-corner-width)',
          bottom: 0,
          ['--scroll-area-thumb-width' as string]: `${thumbSize.width}px`,
        }),
    ...style,
  };

  return (
    <ScrollAreaScrollbarContext.Provider value={contextValue}>
      <div
        {...elementProps}
        ref={mergeRefs(forwardedRef, orientation === 'vertical' ? scrollbarYRef : scrollbarXRef)}
        data-id={rootId ? `${rootId}-scrollbar` : undefined}
        data-orientation={orientation}
        data-hovering={hovering ? '' : undefined}
        data-scrolling={scrolling ? '' : undefined}
        data-has-overflow-x={!hiddenState.x ? '' : undefined}
        data-has-overflow-y={!hiddenState.y ? '' : undefined}
        data-overflow-x-start={overflowEdges.xStart ? '' : undefined}
        data-overflow-x-end={overflowEdges.xEnd ? '' : undefined}
        data-overflow-y-start={overflowEdges.yStart ? '' : undefined}
        data-overflow-y-end={overflowEdges.yEnd ? '' : undefined}
        className={cn(
          'flex touch-none select-none transition-opacity duration-150',
          // 10px interaction zone, but the thumb floats centered inside (see Thumb).
          orientation === 'vertical' ? 'w-2.5 justify-center' : 'h-2.5 items-center',
          // Default fade behavior — visible while hovering or scrolling.
          'opacity-0 data-[hovering]:opacity-100 data-[scrolling]:opacity-100',
          className,
        )}
        style={baseStyle}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const target = event.target as Element | null;
          const thumb = orientation === 'vertical' ? thumbYRef.current : thumbXRef.current;
          // Ignore clicks that originated on the thumb itself.
          if (thumb && contains(thumb, target)) return;

          const viewport = viewportRef.current;
          if (!viewport) return;

          if (thumbYRef.current && scrollbarYRef.current && orientation === 'vertical') {
            const thumbYOffset = getOffset(thumbYRef.current, 'margin', 'y');
            const scrollbarYOffset = getOffset(scrollbarYRef.current, 'padding', 'y');
            const thumbHeight = thumbYRef.current.offsetHeight;
            const trackRectY = scrollbarYRef.current.getBoundingClientRect();
            const clickY =
              event.clientY - trackRectY.top - thumbHeight / 2 - scrollbarYOffset + thumbYOffset / 2;

            const scrollableContentHeight = viewport.scrollHeight;
            const viewportHeight = viewport.clientHeight;

            const maxThumbOffsetY =
              scrollbarYRef.current.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
            const scrollRatioY = clickY / maxThumbOffsetY;
            viewport.scrollTop = scrollRatioY * (scrollableContentHeight - viewportHeight);
          }

          if (thumbXRef.current && scrollbarXRef.current && orientation === 'horizontal') {
            const thumbXOffset = getOffset(thumbXRef.current, 'margin', 'x');
            const scrollbarXOffset = getOffset(scrollbarXRef.current, 'padding', 'x');
            const thumbWidth = thumbXRef.current.offsetWidth;
            const trackRectX = scrollbarXRef.current.getBoundingClientRect();
            const clickX =
              event.clientX - trackRectX.left - thumbWidth / 2 - scrollbarXOffset + thumbXOffset / 2;

            const scrollableContentWidth = viewport.scrollWidth;
            const viewportWidth = viewport.clientWidth;

            const maxThumbOffsetX =
              scrollbarXRef.current.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
            const scrollRatioX = clickX / maxThumbOffsetX;
            viewport.scrollLeft = scrollRatioX * (scrollableContentWidth - viewportWidth);
          }

          handlePointerDown(event);
          onPointerDown?.(event);
        }}
        onPointerUp={(event) => {
          handlePointerUp(event);
          onPointerUp?.(event);
        }}
      >
        {children}
      </div>
    </ScrollAreaScrollbarContext.Provider>
  );
});
