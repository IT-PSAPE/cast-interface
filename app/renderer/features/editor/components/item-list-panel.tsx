import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { IconButton } from '../../../components/controls/icon-button';
import { PanelSection } from '../../../components/display/panel-section';
import { PanelRoute } from '../../workbench/components/panel-route';
import { ObjectListPanel } from './object-list-panel';

interface ItemListPanelProps {
  title: string;
  splitId: string;
  listPanelId: string;
  objectsPanelId: string;
  onAdd: (event: React.MouseEvent<HTMLButtonElement>) => void;
  addLabel: string;
  children: ReactNode;
  contextMenu?: ReactNode;
  listAriaLabel?: string;
}

export function ItemListPanel({ title, splitId, listPanelId, objectsPanelId, onAdd, addLabel, children, contextMenu, listAriaLabel }: ItemListPanelProps) {
  return (
    <aside className="h-full min-h-0 overflow-hidden border-r border-border-primary bg-primary">
      <PanelRoute.Split splitId={splitId} orientation="vertical" className="h-full">
        <PanelRoute.Panel id={listPanelId} defaultSize={440} minSize={180}>
          <PanelSection
            title={<span className="truncate text-sm font-medium text-text-primary">{title}</span>}
            action={(
              <IconButton label={addLabel} size="sm" onClick={onAdd}>
                <Plus size={14} strokeWidth={2} />
              </IconButton>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2" role="grid" aria-label={listAriaLabel ?? title}>
              {children}
            </div>
          </PanelSection>
        </PanelRoute.Panel>
        <PanelRoute.Panel id={objectsPanelId} defaultSize={220} minSize={160}>
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-t border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        </PanelRoute.Panel>
      </PanelRoute.Split>
      {contextMenu}
    </aside>
  );
}
