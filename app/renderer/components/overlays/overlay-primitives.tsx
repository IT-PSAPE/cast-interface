import { cn } from '@renderer/utils/cn';
import { createPortal } from 'react-dom';
import { useEffect, useCallback, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { useWorkbench } from '@renderer/contexts/workbench-context';

// ─── Portal ──────────────────────────────────────────────────────────

type OverlayPortalProps = {
  children: ReactNode;
  isOpen: boolean;
  zIndex: number;
};

export function OverlayPortal({ children, isOpen, zIndex }: OverlayPortalProps) {
  const { overlayStack } = useWorkbench();

  if (!isOpen || !overlayStack.rootElement) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0" style={{ zIndex }}>
      {children}
    </div>,
    overlayStack.rootElement,
  );
}

// ─── Backdrop ────────────────────────────────────────────────────────

type OverlayBackdropProps = HTMLAttributes<HTMLDivElement> & {
  closeOnClick?: boolean;
  onClose: () => void;
};

export function OverlayBackdrop({ className, closeOnClick = true, onClick, onClose, ...props }: OverlayBackdropProps) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    onClick?.(event);

    if (event.defaultPrevented || !closeOnClick) {
      return;
    }

    onClose();
  }

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-auto fixed inset-0 bg-black/50 backdrop-blur-sm', className)}
      onClick={handleClick}
      {...props}
    />
  );
}

// ─── Trigger ─────────────────────────────────────────────────────────

type OverlayTriggerProps = HTMLAttributes<HTMLSpanElement> & {
  onOpen: () => void;
};

export function OverlayTrigger({ children, onClick, onOpen, ...props }: OverlayTriggerProps) {
  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    onOpen();
  }

  return (
    <span onClick={handleClick} {...props} role="button">
      {children}
    </span>
  );
}

// ─── Close ───────────────────────────────────────────────────────────

type OverlayCloseProps = HTMLAttributes<HTMLSpanElement> & {
  onClose: () => void;
};

export function OverlayClose({ children, onClick, onClose, ...props }: OverlayCloseProps) {
  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    onClose();
  }

  return (
    <span onClick={handleClick} {...props} role="button">
      {children}
    </span>
  );
}

// ─── Header ──────────────────────────────────────────────────────────

export function OverlayHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2 border-b border-primary p-3', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────────────────

export function OverlayContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-1 flex-col overflow-y-auto', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────

export function OverlayFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2 border-t border-primary p-3', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────

export type Placement = 'top' | 'bottom' | 'left' | 'right';

type AnchorPosition = {
  top: number;
  left: number;
  placement: Placement;
};

export function useAnchorPosition(
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  preferredPlacement: Placement = 'bottom',
  offset: number = 4,
): AnchorPosition {
  const [position, setPosition] = useState<AnchorPosition>({ top: 0, left: 0, placement: preferredPlacement });

  const calculate = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (!trigger || !panel) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    let placement = preferredPlacement;
    let top = 0;
    let left = 0;

    if (placement === 'bottom') {
      top = triggerRect.bottom + offset;
      left = triggerRect.left;

      if (top + panelRect.height > viewport.height) {
        placement = 'top';
        top = triggerRect.top - panelRect.height - offset;
      }
    } else if (placement === 'top') {
      top = triggerRect.top - panelRect.height - offset;
      left = triggerRect.left;

      if (top < 0) {
        placement = 'bottom';
        top = triggerRect.bottom + offset;
      }
    } else if (placement === 'right') {
      top = triggerRect.top;
      left = triggerRect.right + offset;

      if (left + panelRect.width > viewport.width) {
        placement = 'left';
        left = triggerRect.left - panelRect.width - offset;
      }
    } else if (placement === 'left') {
      top = triggerRect.top;
      left = triggerRect.left - panelRect.width - offset;

      if (left < 0) {
        placement = 'right';
        left = triggerRect.right + offset;
      }
    }

    left = Math.max(4, Math.min(left, viewport.width - panelRect.width - 4));
    top = Math.max(4, Math.min(top, viewport.height - panelRect.height - 4));

    setPosition({ top, left, placement });
  }, [triggerRef, panelRef, preferredPlacement, offset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    calculate();

    window.addEventListener('resize', calculate);
    window.addEventListener('scroll', calculate, true);

    return () => {
      window.removeEventListener('resize', calculate);
      window.removeEventListener('scroll', calculate, true);
    };
  }, [isOpen, calculate]);

  return position;
}

export function useClickOutside(refs: RefObject<HTMLElement | null>[], isActive: boolean, handler: () => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      const isOutside = refs.every(ref => {
        return !ref.current || !ref.current.contains(target);
      });

      if (isOutside) {
        handlerRef.current();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isActive, refs]);
}
