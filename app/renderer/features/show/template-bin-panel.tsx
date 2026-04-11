import type { Id, Template } from '@core/types';
import { Ellipsis } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { buildRenderScene } from '../stage/build-render-scene';
import { BinPanelLayout } from './bin-panel-layout';
import { useTemplateBin } from './use-template-bin';

interface TemplateBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function TemplateBinPanel({ filterText, gridItemSize }: TemplateBinPanelProps) {
  const { filteredTemplates, menu, menuItems, currentTemplateId, handleOpenTemplate } = useTemplateBin(filterText);

  return (
    <BinPanelLayout
      gridItemSize={gridItemSize}
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
  onOpen: (template: Template) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function TemplateCard({ template, index, isSelected, onOpen, onOpenMenu }: TemplateCardProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleOpen() {
    onOpen(template);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, template.id);
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
