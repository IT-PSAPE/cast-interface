import { createContext, useContext, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { Coords, HiddenState, OverflowEdges, Size } from './utils';

// Public state surface the Scrollbar/Viewport read for data-attributes.
export interface ScrollAreaRootState {
  scrolling: boolean;
  hasOverflowX: boolean;
  hasOverflowY: boolean;
  overflowXStart: boolean;
  overflowXEnd: boolean;
  overflowYStart: boolean;
  overflowYEnd: boolean;
  cornerHidden: boolean;
}

export interface ScrollAreaRootContextValue {
  cornerSize: Size;
  setCornerSize: Dispatch<SetStateAction<Size>>;
  thumbSize: Size;
  setThumbSize: Dispatch<SetStateAction<Size>>;
  hasMeasuredScrollbar: boolean;
  setHasMeasuredScrollbar: Dispatch<SetStateAction<boolean>>;
  touchModality: boolean;
  hovering: boolean;
  setHovering: Dispatch<SetStateAction<boolean>>;
  scrollingX: boolean;
  setScrollingX: Dispatch<SetStateAction<boolean>>;
  scrollingY: boolean;
  setScrollingY: Dispatch<SetStateAction<boolean>>;
  viewportRef: RefObject<HTMLDivElement | null>;
  rootRef: RefObject<HTMLDivElement | null>;
  scrollbarYRef: RefObject<HTMLDivElement | null>;
  thumbYRef: RefObject<HTMLDivElement | null>;
  scrollbarXRef: RefObject<HTMLDivElement | null>;
  thumbXRef: RefObject<HTMLDivElement | null>;
  cornerRef: RefObject<HTMLDivElement | null>;
  handlePointerDown: (event: React.PointerEvent) => void;
  handlePointerMove: (event: React.PointerEvent) => void;
  handlePointerUp: (event: React.PointerEvent) => void;
  handleScroll: (scrollPosition: Coords) => void;
  rootId: string | undefined;
  hiddenState: HiddenState;
  setHiddenState: Dispatch<SetStateAction<HiddenState>>;
  overflowEdges: OverflowEdges;
  setOverflowEdges: Dispatch<SetStateAction<OverflowEdges>>;
  viewportState: ScrollAreaRootState;
  overflowEdgeThreshold: { xStart: number; xEnd: number; yStart: number; yEnd: number };
  // Custom: scroll padding used by useScrollAreaActiveItem when scrolling items into view.
  scrollPaddingRef: RefObject<number | `${number}%`>;
}

export const ScrollAreaRootContext = createContext<ScrollAreaRootContextValue | undefined>(undefined);

export function useScrollAreaRootContext(): ScrollAreaRootContextValue {
  const ctx = useContext(ScrollAreaRootContext);
  if (!ctx) {
    throw new Error('ScrollArea parts must be placed within <ScrollArea.Root>.');
  }
  return ctx;
}

export interface ScrollAreaViewportContextValue {
  computeThumbPosition: () => void;
}

export const ScrollAreaViewportContext = createContext<ScrollAreaViewportContextValue | undefined>(undefined);

export function useScrollAreaViewportContext(): ScrollAreaViewportContextValue {
  const ctx = useContext(ScrollAreaViewportContext);
  if (!ctx) {
    throw new Error('ScrollArea.Content must be placed within <ScrollArea.Viewport>.');
  }
  return ctx;
}

export interface ScrollAreaScrollbarContextValue {
  orientation: 'horizontal' | 'vertical';
}

export const ScrollAreaScrollbarContext = createContext<ScrollAreaScrollbarContextValue | undefined>(undefined);

export function useScrollAreaScrollbarContext(): ScrollAreaScrollbarContextValue {
  const ctx = useContext(ScrollAreaScrollbarContext);
  if (!ctx) {
    throw new Error('ScrollArea.Thumb must be placed within <ScrollArea.Scrollbar>.');
  }
  return ctx;
}
