import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@renderer/utils/cn';
import { X } from 'lucide-react';

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
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      onClose();
    }

    window.addEventListener('keydown', handleEscape);
    return () => { window.removeEventListener('keydown', handleEscape); };
  }, [onClose]);

  function handleBackdropMouseDown() {
    onClose();
  }

  function handlePopupMouseDown(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onMouseDown={handleBackdropMouseDown}>
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          data-ui-region={dataUiRegion}
          onMouseDown={handlePopupMouseDown}
          className={cn(
            'pointer-events-auto grid max-h-[calc(100vh-2rem)] w-full grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-border-primary bg-primary shadow-2xl outline-none',
            footer ? 'grid-rows-[auto_1fr_auto]' : '',
            popupClassName,
          )}
        >
          <header className="flex items-center justify-between border-b border-border-primary px-4 py-3">
            <h2 className="m-0 text-lg font-semibold text-text-primary">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid h-6 w-6 cursor-pointer place-items-center rounded bg-transparent text-lg text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-primary"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </header>

          <div className={cn('min-h-0', bodyClassName)}>
            {children}
          </div>

          {footer ? (
            <footer className="flex items-center justify-between border-t border-border-primary px-4 py-3">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>,
    document.getElementById('overlay-root') ?? document.body,
  );
}
