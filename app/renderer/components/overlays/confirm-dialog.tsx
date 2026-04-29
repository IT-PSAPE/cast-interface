import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog } from './dialog';
import { ReacstButton } from '@renderer/components/controls/button';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  // Used to ignore the dialog's onOpenChange(false) once we've already
  // resolved (clicking confirm/cancel) — prevents a double-resolve.
  const resolvedRef = useRef(false);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolvedRef.current = false;
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    if (!pending || resolvedRef.current) return;
    resolvedRef.current = true;
    pending.resolve(value);
    setPending(null);
  }, [pending]);

  const isOpen = pending !== null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={(next) => { if (!next) settle(false); }}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="w-full max-w-md">
              <Dialog.Header>
                <Dialog.Title>{pending?.title ?? ''}</Dialog.Title>
                <Dialog.CloseButton />
              </Dialog.Header>
              {pending?.description ? (
                <Dialog.Body className="px-4 py-3">
                  <Dialog.Description>{pending.description}</Dialog.Description>
                </Dialog.Body>
              ) : null}
              <Dialog.Footer className="justify-end gap-2">
                <ReacstButton variant="ghost" onClick={() => settle(false)}>
                  {pending?.cancelLabel ?? 'Cancel'}
                </ReacstButton>
                <ReacstButton
                  variant={pending?.destructive ? 'danger' : 'take'}
                  onClick={() => settle(true)}
                >
                  {pending?.confirmLabel ?? 'Confirm'}
                </ReacstButton>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

// Convenience wrapper for the common "delete X?" case.
export function useConfirmDelete() {
  const confirm = useConfirm();
  return useCallback(
    (target: string, description?: ReactNode) => confirm({
      title: `Delete ${target}?`,
      description: description ?? `This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    }),
    [confirm],
  );
}

