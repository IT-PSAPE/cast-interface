import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '@renderer/components/controls/button';
import { cn } from '@renderer/utils/cn';
import { OverlayBackdrop, OverlayClose, OverlayPortal, OverlayTrigger } from './overlay-primitives';
import { useOverlayStack } from './overlay-provider';

interface DialogContextValue {
  state: { isOpen: boolean; isTopmost: boolean; zIndex: number };
  actions: { close: () => void; open: () => void; setOpen: (nextOpen: boolean) => void };
  meta: {
    closeOnBackdropClick: boolean;
    descriptionId?: string;
    setDescriptionId: (id?: string) => void;
    setTitleId: (id?: string) => void;
    titleId?: string;
  };
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within a Dialog.Root');
  return context;
}

interface DialogRootProps {
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  open?: boolean;
}

function Root({ children, closeOnBackdropClick = true, closeOnEscape = true, defaultOpen = false, onOpenChange, open }: DialogRootProps) {
  const dialogId = useId();
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [titleId, setTitleId] = useState<string | undefined>(undefined);
  const [descriptionId, setDescriptionId] = useState<string | undefined>(undefined);
  const { actions: overlayActions, meta: overlayMeta, state: overlayState } = useOverlayStack();
  const isOpen = isControlled ? open : uncontrolledOpen;
  const stackIndex = overlayState.stack.indexOf(dialogId);
  const isTopmost = stackIndex === overlayState.stack.length - 1 && stackIndex >= 0;
  const zIndex = overlayMeta.baseZIndex + Math.max(stackIndex, 0) * 10;

  const setOpenState = useCallback((nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange]);

  const openDialog = useCallback(() => {
    setOpenState(true);
  }, [setOpenState]);

  const closeDialog = useCallback(() => {
    setOpenState(false);
  }, [setOpenState]);

  useEffect(() => {
    if (!isOpen) return undefined;
    overlayActions.register(dialogId);
    return () => {
      overlayActions.unregister(dialogId);
    };
  }, [dialogId, isOpen, overlayActions]);

  useEffect(() => {
    if (!closeOnEscape || !isOpen || !isTopmost) return undefined;

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeDialog();
    }

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [closeDialog, closeOnEscape, isOpen, isTopmost]);

  const context = useMemo<DialogContextValue>(() => ({
    state: { isOpen, isTopmost, zIndex },
    actions: { close: closeDialog, open: openDialog, setOpen: setOpenState },
    meta: { closeOnBackdropClick, descriptionId, setDescriptionId, setTitleId, titleId },
  }), [closeDialog, closeOnBackdropClick, descriptionId, isOpen, isTopmost, openDialog, setOpenState, titleId, zIndex]);

  return <DialogContext.Provider value={context}>{children}</DialogContext.Provider>;
}

function Trigger(props: HTMLAttributes<HTMLSpanElement>) {
  const { actions } = useDialog();
  return <OverlayTrigger onOpen={actions.open} {...props} />;
}

function Close(props: HTMLAttributes<HTMLSpanElement>) {
  const { actions } = useDialog();
  return <OverlayClose onClose={actions.close} {...props} />;
}

function Portal({ children }: { children: ReactNode }) {
  const { state } = useDialog();
  return <OverlayPortal isOpen={state.isOpen} zIndex={state.zIndex}>{children}</OverlayPortal>;
}

function Backdrop(props: HTMLAttributes<HTMLDivElement>) {
  const { actions, meta } = useDialog();
  return <OverlayBackdrop closeOnClick={meta.closeOnBackdropClick} onClose={actions.close} {...props} />;
}

function Positioner({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 flex items-center justify-center p-4', className)} {...props}>
      {children}
    </div>
  );
}

function Content({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { meta, state } = useDialog();

  useEffect(() => {
    if (!state.isOpen || !state.isTopmost) return;
    contentRef.current?.focus();
  }, [state.isOpen, state.isTopmost]);

  return (
    <div
      {...props}
      ref={contentRef}
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
      aria-describedby={meta.descriptionId}
      aria-labelledby={meta.titleId}
      className={cn('pointer-events-auto flex w-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-lg border border-primary bg-primary shadow-2xl outline-none', className)}
    >
      {children}
    </div>
  );
}

function Header({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-primary px-4 py-3', className)} {...props}>
      {children}
    </div>
  );
}

function Title({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const generatedId = useId();
  const { meta } = useDialog();

  useEffect(() => {
    meta.setTitleId(generatedId);
    return () => {
      meta.setTitleId(undefined);
    };
  }, [generatedId, meta]);

  return (
    <h2 {...props} id={generatedId} className={cn('m-0 text-lg font-semibold text-primary', className)}>
      {children}
    </h2>
  );
}

function Description({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const generatedId = useId();
  const { meta } = useDialog();

  useEffect(() => {
    meta.setDescriptionId(generatedId);
    return () => {
      meta.setDescriptionId(undefined);
    };
  }, [generatedId, meta]);

  return (
    <p {...props} id={generatedId} className={cn('text-sm text-secondary', className)}>
      {children}
    </p>
  );
}

function CloseButton({ className, label = 'Close', ...props }: Omit<ComponentProps<typeof Button.Icon>, 'children' | 'label'> & { label?: string }) {
  const { actions } = useDialog();

  return (
    <Button.Icon {...props} label={label} variant="ghost" onClick={actions.close} className={cn('shrink-0', className)}>
      <X/>
    </Button.Icon>
  );
}

export const Dialog = { Root, Trigger, Portal, Backdrop, Positioner, Content, Header, Title, Description, Close, CloseButton };
