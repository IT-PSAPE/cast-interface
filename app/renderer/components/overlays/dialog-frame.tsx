import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { Dialog } from './dialog';

interface DialogFrameProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  dataUiRegion?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  popupClassName?: string;
}

export function DialogFrame({ title, onClose, children, dataUiRegion, bodyClassName, footer, popupClassName }: DialogFrameProps) {
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  return (
    <Dialog.Root open onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            data-ui-region={dataUiRegion}
            className={cn(
              'grid max-h-[calc(100vh-2rem)] w-full grid-rows-[auto_1fr] overflow-hidden',
              footer ? 'grid-rows-[auto_1fr_auto]' : '',
              popupClassName,
            )}
          >
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.CloseButton />
            </Dialog.Header>
            <div className={cn('min-h-0', bodyClassName)}>
              {children}
            </div>
            {footer ? <footer className="flex items-center justify-between border-t border-border-primary px-4 py-3">{footer}</footer> : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
