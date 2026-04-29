import type { Template } from '@core/types';
import { SelectableRow } from '../../../components/display/selectable-row';
import { Thumbnail } from '../../../components/display/thumbnail';
import { SceneFrame } from '../../../components/display/scene-frame';
import { buildRenderScene } from '../../canvas/build-render-scene';
import { SceneStage } from '../../canvas/scene-stage';
import { BinPanelLayout } from '@renderer/components/layout/collection-layout';
import { useResourceDrawer } from '../../workbench/resource-drawer-context';
import { useTemplateBin } from './use-template-bin';

interface TemplateBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function TemplateBinPanel({ filterText, gridItemSize }: TemplateBinPanelProps) {
  const { drawerViewMode } = useResourceDrawer();
  const { filteredTemplates, handleApplyTemplate } = useTemplateBin(filterText);

  return (
    <BinPanelLayout gridItemSize={gridItemSize} mode={drawerViewMode}>
      {filteredTemplates.map((template, index) => (
        <TemplateBinItem key={template.id} template={template} index={index} mode={drawerViewMode} onApply={handleApplyTemplate} />
      ))}
    </BinPanelLayout>
  );
}

interface TemplateItemProps {
  template: Template;
  index: number;
  onApply: (template: Template) => void;
}

function TemplateBinItem({ mode, ...props }: TemplateItemProps & { mode: NonNullable<ReturnType<typeof useResourceDrawer>['drawerViewMode']> }) {
  if (mode === 'list') return <TemplateRow {...props} />;
  return <TemplateTile {...props} />;
}

function TemplateRow({ template, index, onApply }: TemplateItemProps) {
  function handleClick() {
    onApply(template);
  }

  return (
    <SelectableRow.Root selected={false} onClick={handleClick} className="h-9">
      <SelectableRow.Leading>
        <span className="text-xs font-semibold tabular-nums text-tertiary">{index + 1}</span>
      </SelectableRow.Leading>
      <SelectableRow.Label>{template.name}</SelectableRow.Label>
      <SelectableRow.Trailing>
        <span className="text-xs uppercase tracking-wide text-tertiary">{template.kind}</span>
      </SelectableRow.Trailing>
    </SelectableRow.Root>
  );
}

function TemplateTile({ template, index, onApply }: TemplateItemProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleClick() {
    onApply(template);
  }

  return (
    <Thumbnail.Tile onClick={handleClick}>
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      </Thumbnail.Body>
      <Thumbnail.Caption>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <span className="min-w-0 truncate text-sm text-tertiary">{template.name}</span>
        </div>
      </Thumbnail.Caption>
    </Thumbnail.Tile>
  );
}
