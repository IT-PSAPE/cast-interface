import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { ContextMenu } from '../../components/overlays/context-menu';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import type { ResourceDrawerViewMode } from '../../types/ui';

interface BinPanelLayoutProps {
  children: ReactNode;
  gridItemSize: number;
  mode?: ResourceDrawerViewMode;
  menuState: { x: number; y: number; data: unknown } | null;
  menuItems: ContextMenuItem[];
  onCloseMenu: () => void;
  listClassName?: string;
}

export function BinPanelLayout({ children, gridItemSize, mode = 'grid', menuState, menuItems, onCloseMenu, listClassName = '' }: BinPanelLayoutProps) {
  function handleMenuOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    onCloseMenu();
  }

  return (
    <ContextMenu.Root open={Boolean(menuState)} position={menuState} onOpenChange={handleMenuOpenChange}>
      {mode === 'grid' ? (
        <ThumbnailGrid columns={gridItemSize}>
          {children}
        </ThumbnailGrid>
      ) : (
        <div className={cn('flex flex-col gap-0.5', listClassName)}>
          {children}
        </div>
      )}
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Items items={menuItems} />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
