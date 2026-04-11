import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clamp } from '../../utils/math';

// ── Types ──────────────────────────────────────────────────

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

interface PopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  placement?: PopoverPlacement;
  offset?: number;
  className?: string;
  children: ReactNode;
}

interface ResolvedPosition {
  top: number;
  left: number;
  placement: PopoverPlacement;
}

// ── Constants ──────────────────────────────────────────────

const VIEWPORT_PADDING = 8;

function getOverlayRoot(): HTMLElement {
  return document.getElementById('overlay-root') ?? document.body;
}

// ── Component ──────────────────────────────────────────────

export function Popover({ anchor, open, onClose, placement = 'bottom', offset = 4, className = '', children }: PopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ResolvedPosition | null>(null);

  // Compute position after content renders so we can measure it
  useLayoutEffect(() => {
    if (!open || !anchor || !contentRef.current) return;
    const pos = resolvePosition(anchor, contentRef.current, placement, offset);
    setPosition(pos);
  }, [open, anchor, placement, offset]);

  // Close on outside pointer
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (contentRef.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, anchor, onClose]);

  // Re-position on scroll/resize while open
  useEffect(() => {
    if (!open || !anchor || !contentRef.current) return;
    const content = contentRef.current;
    function reposition() {
      if (!anchor || !content) return;
      const pos = resolvePosition(anchor, content, placement, offset);
      setPosition(pos);
    }
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, anchor, placement, offset]);

  if (!open) return null;

  // First render: invisible until measured
  const isPositioned = position !== null;

  return createPortal(
    <div
      ref={contentRef}
      className={`pointer-events-auto ${className}`}
      style={{
        position: 'fixed',
        top: isPositioned ? position.top : -9999,
        left: isPositioned ? position.left : -9999,
        visibility: isPositioned ? 'visible' : 'hidden',
      }}
      data-popover-placement={isPositioned ? position.placement : undefined}
    >
      {children}
    </div>,
    getOverlayRoot(),
  );
}

// ── Positioning logic ──────────────────────────────────────

function resolvePosition(
  anchor: HTMLElement,
  content: HTMLElement,
  preferred: PopoverPlacement,
  offset: number,
): ResolvedPosition {
  const anchorRect = anchor.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Try preferred placement first, then opposite, then cross-axis options
  const fallbackOrder = getFallbackOrder(preferred);

  for (const candidate of fallbackOrder) {
    const pos = computePosition(anchorRect, contentRect, candidate, offset);
    if (fitsInViewport(pos, contentRect, vw, vh)) {
      return { ...pos, placement: candidate };
    }
  }

  // Nothing fits perfectly — use preferred and clamp to viewport
  const pos = computePosition(anchorRect, contentRect, preferred, offset);
  return {
    top: clamp(pos.top, VIEWPORT_PADDING, vh - contentRect.height - VIEWPORT_PADDING),
    left: clamp(pos.left, VIEWPORT_PADDING, vw - contentRect.width - VIEWPORT_PADDING),
    placement: preferred,
  };
}

function computePosition(
  anchor: DOMRect,
  content: DOMRect,
  placement: PopoverPlacement,
  offset: number,
): { top: number; left: number } {
  switch (placement) {
    case 'bottom':
      return {
        top: anchor.bottom + offset,
        left: anchor.left + (anchor.width - content.width) / 2,
      };
    case 'top':
      return {
        top: anchor.top - content.height - offset,
        left: anchor.left + (anchor.width - content.width) / 2,
      };
    case 'right':
      return {
        top: anchor.top + (anchor.height - content.height) / 2,
        left: anchor.right + offset,
      };
    case 'left':
      return {
        top: anchor.top + (anchor.height - content.height) / 2,
        left: anchor.left - content.width - offset,
      };
  }
}

function fitsInViewport(
  pos: { top: number; left: number },
  content: DOMRect,
  vw: number,
  vh: number,
): boolean {
  return (
    pos.top >= VIEWPORT_PADDING &&
    pos.left >= VIEWPORT_PADDING &&
    pos.top + content.height <= vh - VIEWPORT_PADDING &&
    pos.left + content.width <= vw - VIEWPORT_PADDING
  );
}

function getFallbackOrder(preferred: PopoverPlacement): PopoverPlacement[] {
  const opposite: Record<PopoverPlacement, PopoverPlacement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  const crossAxis: Record<PopoverPlacement, [PopoverPlacement, PopoverPlacement]> = {
    top: ['left', 'right'],
    bottom: ['left', 'right'],
    left: ['top', 'bottom'],
    right: ['top', 'bottom'],
  };
  return [preferred, opposite[preferred], ...crossAxis[preferred]];
}
