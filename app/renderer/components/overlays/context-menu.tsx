import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const VIEWPORT_PADDING = 8;

function getOverlayRoot(): HTMLElement {
  return document.getElementById('overlay-root') ?? document.body;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
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
  const [clampedPos, setClampedPos] = useState({ left: x, top: y });

  // Clamp menu position into viewport after first render so we can measure
  useLayoutEffect(() => {
    if (!rootRef.current) { setClampedPos({ left: x, top: y }); return; }
    const rect = rootRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setClampedPos({
      left: x + rect.width > vw - VIEWPORT_PADDING ? Math.max(VIEWPORT_PADDING, vw - rect.width - VIEWPORT_PADDING) : x,
      top: y + rect.height > vh - VIEWPORT_PADDING ? Math.max(VIEWPORT_PADDING, vh - rect.height - VIEWPORT_PADDING) : y,
    });
  }, [x, y]);

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
    if (item.disabled) return 'cursor-not-allowed text-tertiary/50';
    if (item.danger) return 'cursor-pointer text-error hover:bg-red-500/10';
    return 'cursor-pointer text-secondary hover:bg-quaternary hover:text-primary';
  }

  function renderSubmenuList(children: ContextMenuItem[]) {
    return children.map((child) => (
      <button
        key={child.id}
        onClick={() => handleSelect(child)}
        disabled={child.disabled}
        className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${getItemClass(child)}`}
      >
        <span className="flex items-center gap-2">
          {child.icon ? <span className="shrink-0">{child.icon}</span> : null}
          <span className="truncate">{child.label}</span>
        </span>
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
                  : 'border-primary hover:border-text-secondary'
              } ${child.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              <span className="h-4 w-4 rounded" style={{ backgroundColor: child.swatchColor }} />
            </button>
          ))}
        </div>
        {actionItems.length ? (
          <div className="mt-1 border-t border-primary pt-1">
            {actionItems.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelect(child)}
                disabled={child.disabled}
                className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${getItemClass(child)}`}
              >
                <span className="flex items-center gap-2">
                  {child.icon ? <span className="shrink-0">{child.icon}</span> : null}
                  <span className="truncate">{child.label}</span>
                </span>
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
      className="pointer-events-auto fixed min-w-[180px] rounded-md border border-primary bg-tertiary p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
      style={{ left: clampedPos.left, top: clampedPos.top }}
    >
      {items.map((item) => (
        <div key={item.id} className="relative" onMouseEnter={() => handleMouseEnter(item)}>
          <button
            onClick={() => handleSelect(item)}
            disabled={item.disabled}
            className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${
              item.disabled
                ? 'cursor-not-allowed text-tertiary/50'
                : item.danger
                  ? 'cursor-pointer text-error hover:bg-red-500/10'
                  : 'cursor-pointer text-secondary hover:bg-quaternary hover:text-primary'
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="flex min-w-0 items-center gap-2">
                {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                <span className="truncate">{item.label}</span>
              </span>
              {item.children?.length ? <ChevronRight size={10} strokeWidth={2.5} /> : null}
            </span>
          </button>

          {item.children?.length && activeSubmenuId === item.id ? (
            <div
              className={`absolute left-full top-0 ml-1 rounded-md border border-primary bg-tertiary p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)] ${
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
    getOverlayRoot(),
  );
}
