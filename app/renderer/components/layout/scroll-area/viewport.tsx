import { forwardRef, useEffect, useMemo, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@renderer/utils/cn';
import {
  ScrollAreaViewportContext,
  useScrollAreaRootContext,
  type ScrollAreaRootState,
  type ScrollAreaViewportContextValue,
} from './context';
import {
  clamp,
  ensureHideScrollbarStyles,
  getOffset,
  HIDE_NATIVE_SCROLLBAR_CLASS,
  MIN_THUMB_SIZE,
  mergeRefs,
  normalizeScrollOffset,
  useIsoLayoutEffect,
  useStableCallback,
  useTimeout,
  type HiddenState,
} from './utils';

// Module-level: register the overflow CSS variables once across all instances.
let scrollAreaOverflowVarsRegistered = false;
function removeCSSVariableInheritance() {
  if (scrollAreaOverflowVarsRegistered) return;
  if (typeof CSS === 'undefined' || !('registerProperty' in CSS)) return;
  // Skip on WebKit — `inherit` on child elements doesn't work with `inherits: false`.
  // In Electron this is Chromium, so safe to register, but match Base UI's check.
  const isWebKit = typeof navigator !== 'undefined'
    && /AppleWebKit/.test(navigator.userAgent)
    && !/Chrome/.test(navigator.userAgent);
  if (isWebKit) return;

  const vars = [
    '--scroll-area-overflow-x-start',
    '--scroll-area-overflow-x-end',
    '--scroll-area-overflow-y-start',
    '--scroll-area-overflow-y-end',
  ];
  for (const name of vars) {
    try {
      CSS.registerProperty({ name, syntax: '<length>', inherits: false, initialValue: '0px' });
    } catch {
      // already registered
    }
  }
  scrollAreaOverflowVarsRegistered = true;
}

export interface ScrollAreaViewportProps extends HTMLAttributes<HTMLDivElement> {}

export const ScrollAreaViewport = forwardRef<HTMLDivElement, ScrollAreaViewportProps>(function ScrollAreaViewport(
  { className, style, children, onScroll, onWheel, onTouchMove, onPointerMove, onPointerEnter, onKeyDown, ...elementProps },
  forwardedRef,
) {
  const {
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    cornerRef,
    cornerSize,
    setCornerSize,
    setThumbSize,
    rootId,
    setHiddenState,
    hiddenState,
    setHasMeasuredScrollbar,
    handleScroll,
    setHovering,
    setOverflowEdges,
    overflowEdgeThreshold,
    scrollingX,
    scrollingY,
    overflowEdges,
  } = useScrollAreaRootContext();

  const programmaticScrollRef = useRef(true);
  const lastMeasuredViewportMetricsRef = useRef<[number, number, number, number]>([NaN, NaN, NaN, NaN]);

  const scrollEndTimeout = useTimeout();
  const waitForAnimationsTimeout = useTimeout();

  const computeThumbPosition = useStableCallback(() => {
    const viewportEl = viewportRef.current;
    const scrollbarYEl = scrollbarYRef.current;
    const scrollbarXEl = scrollbarXRef.current;
    const thumbYEl = thumbYRef.current;
    const thumbXEl = thumbXRef.current;
    const cornerEl = cornerRef.current;
    if (!viewportEl) return;

    const scrollableContentHeight = viewportEl.scrollHeight;
    const scrollableContentWidth = viewportEl.scrollWidth;
    const viewportHeight = viewportEl.clientHeight;
    const viewportWidth = viewportEl.clientWidth;
    const scrollTop = viewportEl.scrollTop;
    const scrollLeft = viewportEl.scrollLeft;

    const lastMetrics = lastMeasuredViewportMetricsRef.current;
    const isFirstMeasurement = Number.isNaN(lastMetrics[0]);
    lastMetrics[0] = viewportHeight;
    lastMetrics[1] = scrollableContentHeight;
    lastMetrics[2] = viewportWidth;
    lastMetrics[3] = scrollableContentWidth;

    if (isFirstMeasurement) setHasMeasuredScrollbar(true);
    if (scrollableContentHeight === 0 || scrollableContentWidth === 0) return;

    const nextHiddenState = getHiddenState(viewportEl);
    const scrollbarYHidden = nextHiddenState.y;
    const scrollbarXHidden = nextHiddenState.x;
    const ratioX = viewportWidth / scrollableContentWidth;
    const ratioY = viewportHeight / scrollableContentHeight;
    const maxScrollLeft = Math.max(0, scrollableContentWidth - viewportWidth);
    const maxScrollTop = Math.max(0, scrollableContentHeight - viewportHeight);

    let scrollLeftFromStart = 0;
    let scrollLeftFromEnd = 0;
    if (!scrollbarXHidden) {
      const rawScrollLeftFromStart = clamp(scrollLeft, 0, maxScrollLeft);
      scrollLeftFromStart = normalizeScrollOffset(rawScrollLeftFromStart, maxScrollLeft);
      scrollLeftFromEnd = maxScrollLeft - scrollLeftFromStart;
    }

    const rawScrollTopFromStart = !scrollbarYHidden ? clamp(scrollTop, 0, maxScrollTop) : 0;
    const scrollTopFromStart = !scrollbarYHidden ? normalizeScrollOffset(rawScrollTopFromStart, maxScrollTop) : 0;
    const scrollTopFromEnd = !scrollbarYHidden ? maxScrollTop - scrollTopFromStart : 0;

    const nextWidth = scrollbarXHidden ? 0 : viewportWidth;
    const nextHeight = scrollbarYHidden ? 0 : viewportHeight;

    let nextCornerWidth = 0;
    let nextCornerHeight = 0;
    if (!scrollbarXHidden && !scrollbarYHidden) {
      nextCornerWidth = scrollbarYEl?.offsetWidth || 0;
      nextCornerHeight = scrollbarXEl?.offsetHeight || 0;
    }

    const cornerNotYetSized = cornerSize.width === 0 && cornerSize.height === 0;
    const cornerWidthOffset = cornerNotYetSized ? nextCornerWidth : 0;
    const cornerHeightOffset = cornerNotYetSized ? nextCornerHeight : 0;

    const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x');
    const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y');
    const thumbXOffset = getOffset(thumbXEl, 'margin', 'x');
    const thumbYOffset = getOffset(thumbYEl, 'margin', 'y');

    const idealNextWidth = nextWidth - scrollbarXOffset - thumbXOffset;
    const idealNextHeight = nextHeight - scrollbarYOffset - thumbYOffset;

    const maxNextWidth = scrollbarXEl
      ? Math.min(scrollbarXEl.offsetWidth - cornerWidthOffset, idealNextWidth)
      : idealNextWidth;
    const maxNextHeight = scrollbarYEl
      ? Math.min(scrollbarYEl.offsetHeight - cornerHeightOffset, idealNextHeight)
      : idealNextHeight;

    const clampedNextWidth = Math.max(MIN_THUMB_SIZE, maxNextWidth * ratioX);
    const clampedNextHeight = Math.max(MIN_THUMB_SIZE, maxNextHeight * ratioY);

    setThumbSize((prev) => {
      if (prev.height === clampedNextHeight && prev.width === clampedNextWidth) return prev;
      return { width: clampedNextWidth, height: clampedNextHeight };
    });

    if (scrollbarYEl && thumbYEl) {
      const maxThumbOffsetY =
        scrollbarYEl.offsetHeight - clampedNextHeight - scrollbarYOffset - thumbYOffset;
      const scrollRangeY = scrollableContentHeight - viewportHeight;
      const scrollRatioY = scrollRangeY === 0 ? 0 : scrollTop / scrollRangeY;
      const thumbOffsetY = Math.min(maxThumbOffsetY, Math.max(0, scrollRatioY * maxThumbOffsetY));
      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX =
        scrollbarXEl.offsetWidth - clampedNextWidth - scrollbarXOffset - thumbXOffset;
      const scrollRangeX = scrollableContentWidth - viewportWidth;
      const scrollRatioX = scrollRangeX === 0 ? 0 : scrollLeft / scrollRangeX;
      const thumbOffsetX = clamp(scrollRatioX * maxThumbOffsetX, 0, maxThumbOffsetX);
      thumbXEl.style.transform = `translate3d(${thumbOffsetX}px,0,0)`;
    }

    const overflowMetricsPx: Array<[string, number]> = [
      ['--scroll-area-overflow-x-start', scrollLeftFromStart],
      ['--scroll-area-overflow-x-end', scrollLeftFromEnd],
      ['--scroll-area-overflow-y-start', scrollTopFromStart],
      ['--scroll-area-overflow-y-end', scrollTopFromEnd],
    ];
    for (const [cssVar, value] of overflowMetricsPx) {
      viewportEl.style.setProperty(cssVar, `${value}px`);
    }

    if (cornerEl) {
      if (scrollbarXHidden || scrollbarYHidden) {
        setCornerSize({ width: 0, height: 0 });
      } else {
        setCornerSize({ width: nextCornerWidth, height: nextCornerHeight });
      }
    }

    setHiddenState((prev) => mergeHiddenState(prev, nextHiddenState));

    const nextOverflowEdges = {
      xStart: !scrollbarXHidden && scrollLeftFromStart > overflowEdgeThreshold.xStart,
      xEnd: !scrollbarXHidden && scrollLeftFromEnd > overflowEdgeThreshold.xEnd,
      yStart: !scrollbarYHidden && scrollTopFromStart > overflowEdgeThreshold.yStart,
      yEnd: !scrollbarYHidden && scrollTopFromEnd > overflowEdgeThreshold.yEnd,
    };

    setOverflowEdges((prev) => {
      if (
        prev.xStart === nextOverflowEdges.xStart
        && prev.xEnd === nextOverflowEdges.xEnd
        && prev.yStart === nextOverflowEdges.yStart
        && prev.yEnd === nextOverflowEdges.yEnd
      ) {
        return prev;
      }
      return nextOverflowEdges;
    });
  });

  useIsoLayoutEffect(() => {
    if (!viewportRef.current) return;
    ensureHideScrollbarStyles();
    removeCSSVariableInheritance();
  }, [viewportRef]);

  useIsoLayoutEffect(() => {
    queueMicrotask(computeThumbPosition);
  }, [computeThumbPosition, hiddenState]);

  useIsoLayoutEffect(() => {
    if (viewportRef.current?.matches(':hover')) setHovering(true);
  }, [viewportRef, setHovering]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (typeof ResizeObserver === 'undefined' || !viewport) return undefined;

    let hasInitialized = false;
    const ro = new ResizeObserver(() => {
      // Skip the duplicate first delivery if dimensions match what we already measured.
      if (!hasInitialized) {
        hasInitialized = true;
        const last = lastMeasuredViewportMetricsRef.current;
        if (
          last[0] === viewport.clientHeight
          && last[1] === viewport.scrollHeight
          && last[2] === viewport.clientWidth
          && last[3] === viewport.scrollWidth
        ) {
          return;
        }
      }
      computeThumbPosition();
    });
    ro.observe(viewport);

    // If a Dialog or similar animates inside the viewport, defer one recompute until
    // animations settle so the thumb size reflects the post-animation layout.
    waitForAnimationsTimeout.start(0, () => {
      const animations = viewport.getAnimations({ subtree: true });
      if (animations.length === 0) return;
      Promise.allSettled(animations.map((a) => a.finished))
        .then(computeThumbPosition)
        .catch(() => {});
    });

    return () => {
      ro.disconnect();
      waitForAnimationsTimeout.clear();
    };
  }, [computeThumbPosition, viewportRef, waitForAnimationsTimeout]);

  function handleUserInteraction() {
    programmaticScrollRef.current = false;
  }

  const viewportState: ScrollAreaRootState = useMemo(
    () => ({
      scrolling: scrollingX || scrollingY,
      hasOverflowX: !hiddenState.x,
      hasOverflowY: !hiddenState.y,
      overflowXStart: overflowEdges.xStart,
      overflowXEnd: overflowEdges.xEnd,
      overflowYStart: overflowEdges.yStart,
      overflowYEnd: overflowEdges.yEnd,
      cornerHidden: hiddenState.corner,
    }),
    [scrollingX, scrollingY, hiddenState.x, hiddenState.y, hiddenState.corner, overflowEdges],
  );

  const contextValue: ScrollAreaViewportContextValue = useMemo(
    () => ({ computeThumbPosition }),
    [computeThumbPosition],
  );

  const inlineStyle: CSSProperties = {
    overflow: 'scroll',
    ...style,
  };

  return (
    <ScrollAreaViewportContext.Provider value={contextValue}>
      <div
        {...elementProps}
        ref={mergeRefs(forwardedRef, viewportRef)}
        role="presentation"
        data-id={rootId ? `${rootId}-viewport` : undefined}
        // Keep non-scrollable viewports out of tab order.
        tabIndex={hiddenState.x && hiddenState.y ? -1 : 0}
        className={cn(HIDE_NATIVE_SCROLLBAR_CLASS, 'size-full', className)}
        style={inlineStyle}
        data-scrolling={viewportState.scrolling ? '' : undefined}
        data-has-overflow-x={viewportState.hasOverflowX ? '' : undefined}
        data-has-overflow-y={viewportState.hasOverflowY ? '' : undefined}
        data-overflow-x-start={viewportState.overflowXStart ? '' : undefined}
        data-overflow-x-end={viewportState.overflowXEnd ? '' : undefined}
        data-overflow-y-start={viewportState.overflowYStart ? '' : undefined}
        data-overflow-y-end={viewportState.overflowYEnd ? '' : undefined}
        onScroll={(event) => {
          const viewport = viewportRef.current;
          if (viewport) {
            computeThumbPosition();
            if (!programmaticScrollRef.current) {
              handleScroll({ x: viewport.scrollLeft, y: viewport.scrollTop });
            }
            // 100ms after the last scroll event, treat scrolling as ended (per scrollend semantics).
            scrollEndTimeout.start(100, () => {
              programmaticScrollRef.current = true;
            });
          }
          onScroll?.(event);
        }}
        onWheel={(e) => {
          handleUserInteraction();
          onWheel?.(e);
        }}
        onTouchMove={(e) => {
          handleUserInteraction();
          onTouchMove?.(e);
        }}
        onPointerMove={(e) => {
          handleUserInteraction();
          onPointerMove?.(e);
        }}
        onPointerEnter={(e) => {
          handleUserInteraction();
          onPointerEnter?.(e);
        }}
        onKeyDown={(e) => {
          handleUserInteraction();
          onKeyDown?.(e);
        }}
      >
        {children}
      </div>
    </ScrollAreaViewportContext.Provider>
  );
});

function getHiddenState(viewport: HTMLElement): HiddenState {
  const y = viewport.clientHeight >= viewport.scrollHeight;
  const x = viewport.clientWidth >= viewport.scrollWidth;
  return { y, x, corner: y || x };
}

function mergeHiddenState(prev: HiddenState, next: HiddenState): HiddenState {
  if (prev.y === next.y && prev.x === next.x && prev.corner === next.corner) return prev;
  return next;
}
