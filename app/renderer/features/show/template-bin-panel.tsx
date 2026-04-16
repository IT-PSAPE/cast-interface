import type { Id, Template } from '@core/types';
import { Ellipsis } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { Paragraph } from '../../components/display/text';
import { Thumbnail } from '../../components/display/thumbnail';
import { SceneFrame } from '../../components/display/scene-frame';
import { buildRenderScene } from '../stage/build-render-scene';
import { SceneStage } from '../stage/scene-stage';
import { BinPanelLayout } from './bin-panel-layout';
import { useResourceDrawer } from '../resource-bin/resource-drawer-context';
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
      {filteredTemplates.map((template, index) => (
        <TemplateCard
          key={template.id}
          template={template}
          index={index}
          isSelected={template.id === currentTemplateId}
          mode={drawerViewMode}
          onOpen={handleOpenTemplate}
          onOpenMenu={menu.openFromButton}
        />
      ))}
    </BinPanelLayout>
  );
}

interface TemplateCardProps {
  template: Template;
  index: number;
  isSelected: boolean;
  mode: 'grid' | 'list';
  onOpen: (template: Template) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function TemplateCard({ template, index, isSelected, mode, onOpen, onOpenMenu }: TemplateCardProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleOpen() {
    onOpen(template);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, template.id);
  }

  if (mode === 'list') {
    return (
      <Thumbnail.Row
        onClick={handleOpen}
        selected={isSelected}
      >
        <Thumbnail.Preview>
          <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0">
            <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
        </Thumbnail.Preview>
        <Thumbnail.Body>
          <>
            <Paragraph.xs className="truncate text-secondary">{template.name}</Paragraph.xs>
            <Paragraph.xs className="uppercase tracking-wide text-tertiary">{template.kind}</Paragraph.xs>
          </>
        </Thumbnail.Body>
        <Thumbnail.Overlay position="top-right" className="right-2 top-2 hidden group-hover:block">
          <div>
            <Button.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
              <Ellipsis />
            </Button.Icon>
          </div>
        </Thumbnail.Overlay>
      </Thumbnail.Row>
    );
  }

  return (
    <Thumbnail.Tile onClick={handleOpen} onDoubleClick={handleOpen} selected={isSelected}>
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      </Thumbnail.Body>
      <Thumbnail.Overlay position="top-right" className="hidden group-hover:block">
        <Button.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
          <Ellipsis />
        </Button.Icon>
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
