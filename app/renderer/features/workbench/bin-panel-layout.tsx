import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import type { ResourceDrawerViewMode } from '../../types/ui';

interface BinPanelLayoutProps {
  children: ReactNode;
  gridItemSize: number;
  mode?: ResourceDrawerViewMode;
  listClassName?: string;
}

export function BinPanelLayout({ children, gridItemSize, mode = 'grid', listClassName = '' }: BinPanelLayoutProps) {
  return (
    <>
      {mode === 'grid' ? (
        <ThumbnailGrid columns={gridItemSize}>
          {children}
        </ThumbnailGrid>
      ) : (
        <div className={cn('flex flex-col gap-0.5', listClassName)}>
          {children}
        </div>
      )}
    </>
  );
}
