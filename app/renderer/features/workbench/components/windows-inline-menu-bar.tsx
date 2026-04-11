import { useEffect, useState, type CSSProperties } from 'react';
import type { InlineWindowMenuItem } from '@core/ipc';
import { cn } from '@renderer/utils/cn';

export function WindowsInlineMenuBar() {
  const [items, setItems] = useState<InlineWindowMenuItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (window.castApi.platform !== 'win32') return;
    let cancelled = false;

    void window.castApi.getInlineWindowMenuItems().then((nextItems) => {
      if (cancelled) return;
      setItems(nextItems);
    }).catch((error) => {
      console.error('[WindowsInlineMenuBar]', error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleOpenMenu(item: InlineWindowMenuItem, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    const popupX = window.screenX + rect.left;
    const popupY = window.screenY + rect.bottom + 4;

    setActiveMenuId(item.id);
    try {
      await window.castApi.popupInlineWindowMenu(item.id, popupX, popupY);
    } finally {
      setActiveMenuId(null);
    }
  }

  if (window.castApi.platform !== 'win32' || items.length === 0) return null;

  return (
    <header
      data-ui-region="windows-inline-menu-bar"
      className="border-b border-border-primary bg-background-primary/95 px-3"
      style={{ WebkitAppRegion: 'drag', height: '36px' } as CSSProperties}
    >
      <div className="flex h-full items-center gap-1 pr-36">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(event) => { void handleOpenMenu(item, event.currentTarget); }}
            className={cn('rounded-md px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary', activeMenuId === item.id && 'bg-background-tertiary text-text-primary')}
            style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
