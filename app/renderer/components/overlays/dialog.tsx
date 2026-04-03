import { cn } from '@renderer/utils/cn';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useOverlayStack } from './overlay-provider';
import { OverlayBackdrop, OverlayClose, OverlayContent, OverlayFooter, OverlayHeader, OverlayPortal, OverlayTrigger } from './overlay-primitives';
import { X } from 'lucide-react';

// ─── Context ─────────────────────────────────────────────────────────

type DialogContextValue = {
  state: {
    isOpen: boolean;
    isTopmost: boolean;
    zIndex: number;
  };
  actions: {
    close: () => void;
    open: () => void;
    setOpen: (nextOpen: boolean) => void;
  };
  meta: {
    closeOnBackdropClick: boolean;
    descriptionId?: string;
    setDescriptionId: (id?: string) => void;
    setTitleId: (id?: string) => void;
    titleId?: string;
  };
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error('useDialog must be used within a Dialog.Root');
  }

  return context;
}

// ─── Root ────────────────────────────────────────────────────────────

type DialogRootProps = {
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  open?: boolean;
};

function DialogRoot({ children, closeOnBackdropClick = true, closeOnEscape = true, defaultOpen = false, onOpenChange, open }: DialogRootProps) {
  const dialogId = useId();
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [titleId, setTitleId] = useState<string | undefined>(undefined);
  const [descriptionId, setDescriptionId] = useState<string | undefined>(undefined);
  const { state: overlayState, actions: overlayActions, meta: overlayMeta } = useOverlayStack();

  const isOpen = isControlled ? open : uncontrolledOpen;
  const stackIndex = overlayState.stack.indexOf(dialogId);
  const isTopmost = stackIndex === overlayState.stack.length - 1 && stackIndex >= 0;
  const zIndex = overlayMeta.baseZIndex + Math.max(stackIndex, 0) * 10;

  const setOpenState = useCallback((nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange]);

  const openDialog = useCallback(() => {
    setOpenState(true);
  }, [setOpenState]);

  const closeDialog = useCallback(() => {
    setOpenState(false);
  }, [setOpenState]);

  const assignTitleId = useCallback((id?: string) => {
    setTitleId(id);
  }, []);

  const assignDescriptionId = useCallback((id?: string) => {
    setDescriptionId(id);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    overlayActions.register(dialogId);

    return () => {
      overlayActions.unregister(dialogId);
    };
  }, [isOpen, dialogId, overlayActions]);

  useEffect(() => {
    if (!isOpen || !isTopmost || !closeOnEscape) {
      return undefined;
    }

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closeDialog();
    }

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [closeDialog, closeOnEscape, isOpen, isTopmost]);

  const value = useMemo<DialogContextValue>(() => ({
    state: {
      isOpen,
      isTopmost,
      zIndex,
    },
    actions: {
      close: closeDialog,
      open: openDialog,
      setOpen: setOpenState,
    },
    meta: {
      closeOnBackdropClick,
      descriptionId,
      setDescriptionId: assignDescriptionId,
      setTitleId: assignTitleId,
      titleId,
    },
  }), [assignDescriptionId, assignTitleId, closeDialog, closeOnBackdropClick, descriptionId, isOpen, isTopmost, openDialog, setOpenState, titleId, zIndex]);

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
}

// ─── Trigger ─────────────────────────────────────────────────────────

function DialogTrigger(props: HTMLAttributes<HTMLSpanElement>) {
  const { actions } = useDialog();
  return <OverlayTrigger onOpen={actions.open} {...props} />;
}

// ─── Close ───────────────────────────────────────────────────────────

function DialogClose(props: HTMLAttributes<HTMLSpanElement>) {
  const { actions } = useDialog();
  return <OverlayClose onClose={actions.close} {...props} />;
}

// ─── Portal ──────────────────────────────────────────────────────────

function DialogPortal({ children }: { children: ReactNode }) {
  const { state } = useDialog();
  return <OverlayPortal isOpen={state.isOpen} zIndex={state.zIndex}>{children}</OverlayPortal>;
}

// ─── Backdrop ────────────────────────────────────────────────────────

function DialogBackdrop(props: HTMLAttributes<HTMLDivElement>) {
  const { actions, meta } = useDialog();
  return <OverlayBackdrop closeOnClick={meta.closeOnBackdropClick} onClose={actions.close} {...props} />;
}

// ─── Positioner ──────────────────────────────────────────────────────

function DialogPositioner({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 flex items-center justify-center p-4', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────

function DialogPanel({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { state, meta } = useDialog();

  useEffect(() => {
    if (!state.isOpen || !state.isTopmost) {
      return;
    }

    panelRef.current?.focus();
  }, [state.isOpen, state.isTopmost]);

  return (
    <div
      ref={panelRef}
      aria-describedby={meta.descriptionId}
      aria-labelledby={meta.titleId}
      aria-modal="true"
      className={cn(
        'pointer-events-auto flex w-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-lg border border-border-primary bg-primary shadow-2xl outline-none',
        className,
      )}
      role="dialog"
      tabIndex={-1}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────

type DialogHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  showClose?: boolean;
};

function DialogHeader({ children, className, title, showClose = true, ...props }: DialogHeaderProps) {
  const { actions } = useDialog();

  return (
    <div className={cn('flex items-center justify-between border-b border-border-primary px-4 py-3', className)} {...props}>
      {title ? (
        <h2 className="m-0 text-lg font-semibold text-text-primary">{title}</h2>
      ) : children}
      {showClose ? (
        <button
          type="button"
          aria-label="Close"
          onClick={actions.close}
          className="grid h-6 w-6 cursor-pointer place-items-center rounded bg-transparent text-lg text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-primary"
        >
          <X size={14} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

// ─── Content / Footer ────────────────────────────────────────────────

function DialogContent(props: HTMLAttributes<HTMLDivElement>) {
  return <OverlayContent {...props} />;
}

function DialogFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <OverlayFooter {...props} />;
}

// ─── Compound Export ─────────────────────────────────────────────────

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Positioner: DialogPositioner,
  Panel: DialogPanel,
  Header: DialogHeader,
  Content: DialogContent,
  Footer: DialogFooter,
  Close: DialogClose,
};
