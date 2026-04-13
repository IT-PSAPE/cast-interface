import type { Id, Template } from '@core/types';
import { Ellipsis } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { Paragraph } from '../../components/display/text';
import { Thumbnail } from '../../components/display/thumbnail';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { SceneFrame } from '../../components/display/scene-frame';
import { buildRenderScene } from '../stage/build-render-scene';
import { SceneStage } from '../stage/scene-stage';
import { BinPanelLayout } from './bin-panel-layout';
import { useResourceDrawer } from './resource-drawer-context';
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
        preview={(
          <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0">
            <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
        )}
        body={(
          <>
            <Paragraph.xs className="truncate text-secondary">{template.name}</Paragraph.xs>
            <Paragraph.xs className="uppercase tracking-wide text-tertiary">{template.kind}</Paragraph.xs>
          </>
        )}
        overlay={(
          <div className="absolute right-2 top-2 hidden group-hover:block">
            <Button.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
              <Ellipsis />
            </Button.Icon>
          </div>
        )}
      />
    );
  }

  return (
    <SceneThumbnailCard
      scene={scene}
      index={index}
      label={template.name}
      secondaryText={template.name}
      selected={isSelected}
      onClick={handleOpen}
      onDoubleClick={handleOpen}
      menuButton={(
        <Button.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
          <Ellipsis/>
        </Button.Icon>
      )}
    />
  );
}
