import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  swatchColor?: string;
  onSelect?: () => void;
  children?: ContextMenuItem[];
  childrenLayout?: 'list' | 'color-grid';
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      onClose();
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('contextmenu', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('contextmenu', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  function handleSelect(item: ContextMenuItem) {
    if (item.disabled || item.children?.length) return;
    item.onSelect?.();
    onClose();
  }

  function handleMouseEnter(item: ContextMenuItem) {
    setActiveSubmenuId(item.children?.length ? item.id : null);
  }

  function getItemClass(item: ContextMenuItem): string {
    if (item.disabled) return 'cursor-not-allowed text-text-muted/50';
    if (item.danger) return 'cursor-pointer text-error hover:bg-danger/20';
    return 'cursor-pointer text-text-secondary hover:bg-surface-3 hover:text-text-primary';
  }

  function renderSubmenuList(children: ContextMenuItem[]) {
    return children.map((child) => (
      <button
        key={child.id}
        onClick={() => handleSelect(child)}
        disabled={child.disabled}
        className={`w-full rounded px-2 py-1 text-left text-[12px] transition-colors ${getItemClass(child)}`}
      >
        {child.label}
      </button>
    ));
  }

  function renderColorGrid(children: ContextMenuItem[]) {
    const colorItems = children.filter((child) => child.swatchColor);
    const actionItems = children.filter((child) => !child.swatchColor);

    return (
      <>
        <div className="grid grid-cols-8 gap-1 p-1">
          {colorItems.map((child) => (
            <button
              key={child.id}
              onClick={() => handleSelect(child)}
              disabled={child.disabled}
              title={child.label}
              aria-label={child.label}
              className={`grid h-6 w-6 place-items-center rounded-md border transition-colors ${
                child.selected
                  ? 'border-text-primary/90 shadow-[0_0_0_1px_rgba(255,255,255,0.3)]'
                  : 'border-stroke hover:border-text-secondary'
              } ${child.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              <span className="h-4 w-4 rounded" style={{ backgroundColor: child.swatchColor }} />
            </button>
          ))}
        </div>
        {actionItems.length ? (
          <div className="mt-1 border-t border-stroke pt-1">
            {actionItems.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelect(child)}
                disabled={child.disabled}
                className={`w-full rounded px-2 py-1 text-left text-[12px] transition-colors ${getItemClass(child)}`}
              >
                {child.label}
              </button>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  return createPortal(
    <div
      ref={rootRef}
      className="fixed z-[9999] min-w-[180px] rounded-md border border-stroke bg-surface-2 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <div key={item.id} className="relative" onMouseEnter={() => handleMouseEnter(item)}>
          <button
            onClick={() => handleSelect(item)}
            disabled={item.disabled}
            className={`w-full rounded px-2 py-1 text-left text-[12px] transition-colors ${
              item.disabled
                ? 'cursor-not-allowed text-text-muted/50'
                : item.danger
                  ? 'cursor-pointer text-error hover:bg-danger/20'
                  : 'cursor-pointer text-text-secondary hover:bg-surface-3 hover:text-text-primary'
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="truncate">{item.label}</span>
              {item.children?.length ? <span className="text-[10px]">›</span> : null}
            </span>
          </button>

          {item.children?.length && activeSubmenuId === item.id ? (
            <div
              className={`absolute left-full top-0 ml-1 rounded-md border border-stroke bg-surface-2 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)] ${
                item.childrenLayout === 'color-grid'
                  ? 'min-w-[236px]'
                  : 'min-w-[190px] max-h-56 overflow-y-auto'
              }`}
            >
              {item.childrenLayout === 'color-grid'
                ? renderColorGrid(item.children)
                : renderSubmenuList(item.children)}
            </div>
          ) : null}
        </div>
      ))}
    </div>,
    document.body
  );
}
