import type { ReactNode } from 'react';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { ContextMenu } from '../../components/overlays/context-menu';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';

interface BinPanelLayoutProps {
  children: ReactNode;
  gridItemSize: number;
  menuState: { x: number; y: number; data: unknown } | null;
  menuItems: ContextMenuItem[];
  onCloseMenu: () => void;
}

export function BinPanelLayout({ children, gridItemSize, menuState, menuItems, onCloseMenu }: BinPanelLayoutProps) {
  return (
    <>
      <ThumbnailGrid columns={gridItemSize}>
        {children}
      </ThumbnailGrid>
      {menuState ? (
        <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={onCloseMenu} />
      ) : null}
    </>
  );
}
