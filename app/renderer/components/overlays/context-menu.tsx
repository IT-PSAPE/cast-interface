import { Check, ChevronRight } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@renderer/utils/cn';

const VIEWPORT_PADDING = 8;

export interface ContextMenuPoint {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  separator?: boolean;
  swatchColor?: string;
  onSelect?: () => void;
  children?: ContextMenuItem[];
  childrenLayout?: 'list' | 'color-grid';
}

interface ContextMenuContextValue {
  state: { activeSubmenuId: string | null; isOpen: boolean; position: ContextMenuPoint | null };
  actions: {
    close: () => void;
    openAt: (position: ContextMenuPoint) => void;
    selectItem: (item: ContextMenuItem) => void;
    setActiveSubmenuId: (id: string | null) => void;
  };
  meta: { popupRef: RefObject<HTMLDivElement | null>; zIndex: number };
}

interface RootProps {
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  open?: boolean;
  position?: ContextMenuPoint | null;
  zIndex?: number;
}

interface TriggerProps extends HTMLAttributes<HTMLSpanElement> {
  disabled?: boolean;
}

interface PopupProps extends HTMLAttributes<HTMLDivElement> {
  minWidthClassName?: string;
}

interface ItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onSelect'> {
  children: ReactNode;
  danger?: boolean;
  icon?: ReactNode;
  onSelect?: () => void;
  selected?: boolean;
}

interface SubmenuRootProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
}

interface SubmenuPopupProps extends HTMLAttributes<HTMLDivElement> {
  layout?: ContextMenuItem['childrenLayout'];
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function getOverlayRoot(): HTMLElement { return document.getElementById('overlay-root') ?? document.body; }

function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) throw new Error('ContextMenu components must be used within ContextMenu.Root');
  return context;
}

function Root({ children, defaultOpen = false, onOpenChange, open, position, zIndex = 1000 }: RootProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const isControlled = open !== undefined;
  const isPositionControlled = position !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [uncontrolledPosition, setUncontrolledPosition] = useState<ContextMenuPoint | null>(null);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const isOpen = isControlled ? open : uncontrolledOpen;
  const currentPosition = isPositionControlled ? position : uncontrolledPosition;

  const setOpenState = useCallback((nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen);
    if (!nextOpen) setActiveSubmenuId(null);
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange]);

  const close = useCallback(() => {
    setOpenState(false);
  }, [setOpenState]);

  const openAt = useCallback((nextPosition: ContextMenuPoint) => {
    if (!isPositionControlled) setUncontrolledPosition(nextPosition);
    setOpenState(true);
  }, [isPositionControlled, setOpenState]);

  const selectItem = useCallback((item: ContextMenuItem) => {
    if (item.disabled || item.children?.length) return;
    item.onSelect?.();
    close();
  }, [close]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (popupRef.current?.contains(event.target as Node)) return;
      close();
    }

    function handleContextMenu(event: MouseEvent) {
      if (popupRef.current?.contains(event.target as Node)) return;
      close();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [close, isOpen]);

  const context = useMemo<ContextMenuContextValue>(() => ({
    state: { activeSubmenuId, isOpen, position: currentPosition },
    actions: { close, openAt, selectItem, setActiveSubmenuId },
    meta: { popupRef, zIndex },
  }), [activeSubmenuId, close, currentPosition, isOpen, openAt, selectItem, zIndex]);

  return <ContextMenuContext.Provider value={context}>{children}</ContextMenuContext.Provider>;
}

function Trigger({ children, className, disabled = false, onContextMenu, ...props }: TriggerProps) {
  const { actions } = useContextMenu();

  function handleContextMenu(event: ReactMouseEvent<HTMLSpanElement>) {
    onContextMenu?.(event);
    if (event.defaultPrevented || disabled) return;
    event.preventDefault();
    actions.openAt({ x: event.clientX, y: event.clientY });
  }

  return (
    <span className={cn('contents', className)} onContextMenu={handleContextMenu} {...props}>
      {children}
    </span>
  );
}

function ButtonTrigger({ children, className, disabled = false, onClick, ...props }: TriggerProps) {
  const { actions } = useContextMenu();

  function handleClick(event: ReactMouseEvent<HTMLSpanElement>) {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    actions.openAt({ x: rect.left, y: rect.bottom + 4 });
  }

  return (
    <span className={cn('inline-flex', className)} onClick={handleClick} {...props}>
      {children}
    </span>
  );
}

function Portal({ children }: { children: ReactNode }) {
  const { state, meta } = useContextMenu();
  if (!state.isOpen || !state.position) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: meta.zIndex }}>
      {children}
    </div>,
    getOverlayRoot(),
  );
}

function Positioner({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const positionerRef = useRef<HTMLDivElement | null>(null);
  const { state } = useContextMenu();
  const [clampedPosition, setClampedPosition] = useState<ContextMenuPoint>(state.position ?? { x: 0, y: 0 });

  useLayoutEffect(() => {
    const nextPosition = state.position;
    if (!nextPosition) return;
    const rect = positionerRef.current?.getBoundingClientRect();
    if (!rect) {
      setClampedPosition(nextPosition);
      return;
    }
    setClampedPosition({
      x: nextPosition.x + rect.width > window.innerWidth - VIEWPORT_PADDING
        ? Math.max(VIEWPORT_PADDING, window.innerWidth - rect.width - VIEWPORT_PADDING)
        : nextPosition.x,
      y: nextPosition.y + rect.height > window.innerHeight - VIEWPORT_PADDING
        ? Math.max(VIEWPORT_PADDING, window.innerHeight - rect.height - VIEWPORT_PADDING)
        : nextPosition.y,
    });
  }, [state.position]);

  if (!state.position) return null;

  return (
    <div
      ref={positionerRef}
      className={cn('pointer-events-auto fixed', className)}
      style={{ left: clampedPosition.x, top: clampedPosition.y }}
      {...props}
    >
      {children}
    </div>
  );
}

function Popup({ children, className, minWidthClassName = 'min-w-[180px]', ...props }: PopupProps) {
  const { meta } = useContextMenu();
  return (
    <div
      ref={meta.popupRef}
      role="menu"
      className={cn(minWidthClassName, 'rounded-md border border-primary bg-tertiary p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn('my-1 h-px bg-border-primary', className)} {...props} />;
}

function Item({ children, className, danger = false, disabled = false, icon, onClick, onSelect, selected = false, ...props }: ItemProps) {
  const { actions } = useContextMenu();
  const item: ContextMenuItem = { id: '', danger, disabled, onSelect };

  function handleClick(event: ReactMouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    actions.selectItem(item);
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn('w-full rounded px-2 py-1 text-left text-sm transition-colors', getItemClassName(item), className)}
      {...props}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <span className="truncate">{children}</span>
        </span>
        {selected ? <Check size={12} strokeWidth={2.5} className="shrink-0 text-primary" /> : null}
      </span>
    </button>
  );
}

function Items({ items }: { items: ContextMenuItem[] }) {
  return items.map((item) => <ConfiguredItem key={item.id} item={item} />);
}

function SubmenuRoot({ children, id, onMouseEnter, ...props }: SubmenuRootProps) {
  const { actions } = useContextMenu();

  function handleMouseEnter(event: ReactMouseEvent<HTMLDivElement>) {
    onMouseEnter?.(event);
    if (event.defaultPrevented) return;
    actions.setActiveSubmenuId(id);
  }

  return <div className="relative" onMouseEnter={handleMouseEnter} {...props}>{children}</div>;
}

function SubmenuTrigger({ item }: { item: ContextMenuItem }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      className={cn('w-full rounded px-2 py-1 text-left text-sm transition-colors', getItemClassName(item))}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
          <span className="truncate">{item.label}</span>
        </span>
        <ChevronRight size={10} strokeWidth={2.5} />
      </span>
    </button>
  );
}

function SubmenuPopup({ children, className, layout = 'list', ...props }: SubmenuPopupProps) {
  return (
    <div
      className={cn(
        'absolute left-full top-0 ml-1 rounded-md border border-primary bg-tertiary p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]',
        layout === 'color-grid' ? 'min-w-[236px]' : 'min-w-[190px] max-h-56 overflow-y-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ConfiguredItem({ item }: { item: ContextMenuItem }) {
  const { state } = useContextMenu();

  if (item.separator) return <Separator />;
  if (item.children?.length) {
    return (
      <SubmenuRoot id={item.id}>
        <SubmenuTrigger item={item} />
        {state.activeSubmenuId === item.id ? (
          <SubmenuPopup layout={item.childrenLayout}>
            {item.childrenLayout === 'color-grid' ? <ColorGridItems items={item.children} /> : <Items items={item.children} />}
          </SubmenuPopup>
        ) : null}
      </SubmenuRoot>
    );
  }

  return <Item danger={item.danger} disabled={item.disabled} icon={item.icon} onSelect={item.onSelect} selected={item.selected}>{item.label}</Item>;
}

function ColorGridItems({ items }: { items: ContextMenuItem[] }) {
  const actionItems = items.filter((item) => !item.swatchColor);
  const colorItems = items.filter((item) => item.swatchColor);

  return (
    <>
      <div className="grid grid-cols-8 gap-1 p-1">
        {colorItems.map((item) => <ColorGridItem key={item.id} item={item} />)}
      </div>
      {actionItems.length ? (
        <div className="mt-1 border-t border-primary pt-1">
          <Items items={actionItems} />
        </div>
      ) : null}
    </>
  );
}

function ColorGridItem({ item }: { item: ContextMenuItem }) {
  const { actions } = useContextMenu();

  function handleClick() {
    actions.selectItem(item);
  }

  return (
    <button
      type="button"
      disabled={item.disabled}
      title={item.label}
      aria-label={item.label}
      onClick={handleClick}
      className={cn('grid h-6 w-6 place-items-center rounded-md border transition-colors', item.selected ? 'border-text-primary/90 shadow-[0_0_0_1px_rgba(255,255,255,0.3)]' : 'border-primary hover:border-text-secondary', item.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer')}
    >
      <span className="h-4 w-4 rounded" style={{ backgroundColor: item.swatchColor }} />
    </button>
  );
}

function getItemClassName(item: Pick<ContextMenuItem, 'danger' | 'disabled'>): string {
  if (item.disabled) return 'cursor-not-allowed text-tertiary/50';
  if (item.danger) return 'cursor-pointer text-error hover:bg-red-500/10';
  return 'cursor-pointer text-secondary hover:bg-quaternary hover:text-primary';
}

export const ContextMenu = { Root, Trigger, ButtonTrigger, Portal, Positioner, Popup, Item, Items, Separator, SubmenuRoot, SubmenuTrigger, SubmenuPopup };
