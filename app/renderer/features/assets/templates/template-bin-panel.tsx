import { memo, useMemo, useRef } from 'react';
import type { DeckItem, Overlay, Template } from '@core/types';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { LazySceneStage } from '@renderer/components/display/lazy-scene-stage';
import { ContextMenu, useContextMenuTrigger } from '../../../components/overlays/context-menu';
import { useConfirm } from '../../../components/overlays/confirm-dialog';
import { RenameField, type RenameFieldHandle } from '../../../components/form/rename-field';
import { SelectableRow } from '../../../components/display/selectable-row';
import { Thumbnail } from '../../../components/display/thumbnail';
import { SceneFrame } from '../../../components/display/scene-frame';
import { useTemplateEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { buildRenderScene } from '../../canvas/build-render-scene';
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
        <TemplateBinItem
          key={template.id}
          template={template}
          index={index}
          mode={drawerViewMode}
          onApply={handleApplyTemplate}
        />
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

function TemplateRowImpl(props: TemplateItemProps) {
  return (
    <ContextMenu.Root>
      <TemplateRowBody {...props} />
    </ContextMenu.Root>
  );
}

function TemplateRowBody({ template, index, onApply }: TemplateItemProps) {
  const { renameTemplate } = useTemplateEditor();
  const renameRef = useRef<RenameFieldHandle>(null);
  const { ref: triggerRef, ...triggerHandlers } = useContextMenuTrigger();

  function handleClick() {
    onApply(template);
  }

  function handleRename(next: string) {
    renameTemplate(template.id, next);
  }

  return (
    <>
      <SelectableRow.Root
        {...triggerHandlers}
        ref={triggerRef}
        selected={false}
        onClick={handleClick}
        className="h-9"
      >
        <SelectableRow.Leading>
          <span className="text-xs font-semibold tabular-nums text-tertiary">{index + 1}</span>
        </SelectableRow.Leading>
        <SelectableRow.Label>
          <RenameField ref={renameRef} value={template.name} onValueChange={handleRename} className="label-xs" />
        </SelectableRow.Label>
        <SelectableRow.Trailing>
          <span className="text-xs uppercase tracking-wide text-tertiary">{template.kind}</span>
        </SelectableRow.Trailing>
      </SelectableRow.Root>
      <TemplateContextMenuItems template={template} renameRef={renameRef} />
    </>
  );
}

function TemplateTileImpl(props: TemplateItemProps) {
  return (
    <ContextMenu.Root>
      <TemplateTileBody {...props} />
    </ContextMenu.Root>
  );
}

function TemplateTileBody({ template, index, onApply }: TemplateItemProps) {
  const { renameTemplate } = useTemplateEditor();
  const scene = useMemo(() => buildRenderScene(null, template.elements), [template.elements]);
  const renameRef = useRef<RenameFieldHandle>(null);
  const { ref: triggerRef, ...triggerHandlers } = useContextMenuTrigger();

  function handleClick() {
    onApply(template);
  }

  function handleRename(next: string) {
    renameTemplate(template.id, next);
  }

  return (
    <>
      <div {...triggerHandlers} ref={triggerRef}>
        <Thumbnail.Tile onClick={handleClick}>
          <Thumbnail.Body>
            <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
              <LazySceneStage scene={scene} surface="list" className="absolute inset-0" />
            </SceneFrame>
          </Thumbnail.Body>
          <Thumbnail.Caption>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
              <RenameField ref={renameRef} value={template.name} onValueChange={handleRename} className="label-xs" />
            </div>
          </Thumbnail.Caption>
        </Thumbnail.Tile>
      </div>
      <TemplateContextMenuItems template={template} renameRef={renameRef} />
    </>
  );
}

function TemplateContextMenuItems({
  template,
  renameRef,
}: {
  template: Template;
  renameRef: React.RefObject<RenameFieldHandle | null>;
}) {
  const { applyTemplateToTarget, deleteTemplate } = useTemplateEditor();
  const { presentations, lyrics, overlays } = useProjectContent();
  const confirm = useConfirm();

  const compatibleDeckItems = useMemo<DeckItem[]>(() => {
    if (template.kind === 'overlays') return [];
    return [...presentations, ...lyrics].filter((item) =>
      isTemplateCompatibleWithDeckItem(template, item.type),
    );
  }, [lyrics, presentations, template]);

  const compatibleOverlays = useMemo<Overlay[]>(() => {
    if (template.kind !== 'overlays') return [];
    return overlays;
  }, [overlays, template.kind]);

  const hasTargets = compatibleDeckItems.length > 0 || compatibleOverlays.length > 0;
  const targetLabel = template.kind === 'overlays' ? 'overlays' : template.kind === 'lyrics' ? 'lyrics' : 'presentations';

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${template.name}"?`,
      description: 'Slides linked to this template will be detached.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteTemplate(template.id);
  }

  return (
    <ContextMenu.Portal>
      <ContextMenu.Menu>
        <ContextMenu.Item onSelect={() => { renameRef.current?.startEditing(); }}>Rename</ContextMenu.Item>
        <ContextMenu.Submenu label="Apply to" disabled={!hasTargets}>
          {!hasTargets ? (
            <ContextMenu.Item disabled>No compatible {targetLabel}</ContextMenu.Item>
          ) : (
            <>
              {compatibleDeckItems.map((item) => (
                <ContextMenu.Item
                  key={item.id}
                  onSelect={() => { void applyTemplateToTarget(template.id, { type: 'deck-item', itemId: item.id }); }}
                >
                  {item.title}
                </ContextMenu.Item>
              ))}
              {compatibleOverlays.map((overlay) => (
                <ContextMenu.Item
                  key={overlay.id}
                  onSelect={() => { void applyTemplateToTarget(template.id, { type: 'overlay', overlayId: overlay.id }); }}
                >
                  {overlay.name}
                </ContextMenu.Item>
              ))}
            </>
          )}
        </ContextMenu.Submenu>
        <ContextMenu.Separator />
        <ContextMenu.Item variant="destructive" onSelect={() => { void handleDelete(); }}>Delete</ContextMenu.Item>
      </ContextMenu.Menu>
    </ContextMenu.Portal>
  );
}

const TemplateRow = memo(TemplateRowImpl);
const TemplateTile = memo(TemplateTileImpl);
