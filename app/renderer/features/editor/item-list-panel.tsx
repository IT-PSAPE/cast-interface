import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { Panel } from '../../components/panel';
import { PanelRoute } from '../workbench/panel-route';
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
    <Panel.Root as="aside" bordered="right">
      <PanelRoute.Split splitId={splitId} orientation="vertical" className="h-full">
        <PanelRoute.Panel id={listPanelId} defaultSize={440} minSize={180}>
          <Panel.Section
            title={<span className="truncate text-sm font-medium text-primary">{title}</span>}
            action={(
              <Button.Icon label={addLabel} onClick={onAdd}>
                <Plus/>
              </Button.Icon>
            )}
            headerClassName="border-b border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-1" role="grid" aria-label={listAriaLabel ?? title}>
              {children}
            </div>
          </Panel.Section>
        </PanelRoute.Panel>
        <PanelRoute.Panel id={objectsPanelId} defaultSize={220} minSize={160}>
          <Panel.Section
            title={<span className="text-sm font-medium text-primary">Objects</span>}
            headerClassName="border-b border-t border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </Panel.Section>
        </PanelRoute.Panel>
      </PanelRoute.Split>
      {contextMenu}
    </Panel.Root>
  );
}
