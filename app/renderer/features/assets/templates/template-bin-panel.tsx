import type { Id, Template } from '@core/types';
import { Ellipsis } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { SelectableRow } from '../../../components/display/selectable-row';
import { Thumbnail } from '../../../components/display/thumbnail';
import { SceneFrame } from '../../../components/display/scene-frame';
import { buildRenderScene } from '../../canvas/build-render-scene';
import { SceneStage } from '../../canvas/scene-stage';
import { BinPanelLayout } from '../../workbench/bin-panel-layout';
import { useResourceDrawer } from '../../workbench/resource-drawer-context';
import { useTemplateBin } from './use-template-bin';

interface TemplateBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function TemplateBinPanel({ filterText, gridItemSize }: TemplateBinPanelProps) {
  const { drawerViewMode } = useResourceDrawer();
  const { filteredTemplates, menu, menuItems, currentTemplateId, handleOpenTemplate } = useTemplateBin(filterText);

  return (
    <BinPanelLayout
      gridItemSize={gridItemSize}
      mode={drawerViewMode}
      menuState={menu.menuState}
      menuItems={menuItems}
      onCloseMenu={menu.close}
    >
      {filteredTemplates.map((template, index) => {
        const shared = {
          key: template.id,
          template,
          index,
          isSelected: template.id === currentTemplateId,
          onOpen: handleOpenTemplate,
          onOpenMenu: menu.openFromButton,
        };
        return drawerViewMode === 'list'
          ? <TemplateRow {...shared} />
          : <TemplateTile {...shared} />;
      })}
    </BinPanelLayout>
  );
}

interface TemplateItemProps {
  template: Template;
  index: number;
  isSelected: boolean;
  onOpen: (template: Template) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function TemplateRow({ template, index, isSelected, onOpen, onOpenMenu }: TemplateItemProps) {
  function handleOpen() {
    onOpen(template);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, template.id);
  }

  return (
    <div className="group">
      <SelectableRow.Root selected={isSelected} onClick={handleOpen} className="h-9">
        <SelectableRow.Leading>
          <span className="text-xs font-semibold tabular-nums text-tertiary">{index + 1}</span>
        </SelectableRow.Leading>
        <SelectableRow.Label>{template.name}</SelectableRow.Label>
        <SelectableRow.Trailing>
          <span className="text-xs uppercase tracking-wide text-tertiary">{template.kind}</span>
          <ReacstButton.Icon label="Template options" variant="ghost" onClick={handleMenuClick} className="opacity-0 group-hover:opacity-100">
            <Ellipsis size={14} />
          </ReacstButton.Icon>
        </SelectableRow.Trailing>
      </SelectableRow.Root>
    </div>
  );
}

function TemplateTile({ template, index, isSelected, onOpen, onOpenMenu }: TemplateItemProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleOpen() {
    onOpen(template);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, template.id);
  }

  return (
    <Thumbnail.Tile onClick={handleOpen} onDoubleClick={handleOpen} selected={isSelected}>
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      </Thumbnail.Body>
      <Thumbnail.Overlay position="top-right" className="hidden group-hover:block">
        <ReacstButton.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
          <Ellipsis />
        </ReacstButton.Icon>
      </Thumbnail.Overlay>
      <Thumbnail.Caption>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <span className="min-w-0 truncate text-sm text-tertiary">{template.name}</span>
        </div>
      </Thumbnail.Caption>
    </Thumbnail.Tile>
  );
}
