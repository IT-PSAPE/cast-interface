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
  return (
    <>
      {mode === 'grid' ? (
        <ThumbnailGrid columns={gridItemSize}>
          {children}
        </ThumbnailGrid>
      ) : (
        <div className={cn('flex flex-col gap-2', listClassName)}>
          {children}
        </div>
      )}
      {menuState ? (
        <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={onCloseMenu} />
      ) : null}
    </>
  );
}
