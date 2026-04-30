import { useMemo } from 'react';
import type { Template } from '@core/types';
import { Layers, Music, Plus, Presentation } from 'lucide-react';
import { LazySceneStage } from '@renderer/components/display/lazy-scene-stage';
import { LumaCastPanel } from '@renderer/components/layout/panel';
import { SceneFrame } from '../../components/display/scene-frame';
import { Thumbnail } from '../../components/display/thumbnail';
import { Dropdown } from '../../components/form/dropdown';
import { buildRenderScene } from '../../features/canvas/build-render-scene';
import { StagePanel } from '../../features/canvas/stage-panel';
import { SplitPanel } from '@renderer/components/layout/panel-split/split-panel';
import { EmptyState } from '@renderer/components/display/empty-state';
import { Label } from '@renderer/components/display/text';
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';
import { TemplateEditorInspectorPanel } from './inspector-panel';
import { TemplateEditorLayersPanel } from './layers-panel';
import { TemplateEditorScreenProvider, useTemplateEditorScreen } from './screen-context';

export function TemplateEditorScreen() {
  return (
    <TemplateEditorScreenProvider>
      <TemplateEditorScreenContent />
    </TemplateEditorScreenProvider>
  );
}

function TemplateEditorScreenContent() {
  const { state, actions } = useTemplateEditorScreen();

  return (
    <SplitPanel.Panel splitId="editor-main" orientation="horizontal" className="h-full" data-ui-region="editor-layout">
      <SplitPanel.Segment id="editor-left" defaultSize={280} minSize={140} collapsible>
        <LumaCastPanel.Root className="h-full border-r border-secondary">
          <SplitPanel.Panel splitId="template-list-panel" orientation="vertical" className="h-full">
            <SplitPanel.Segment id="template-list" defaultSize={440} minSize={180}>
              <LumaCastPanel.Group>
                <LumaCastPanel.GroupTitle>
                  <Label.sm className="mr-auto">Templates</Label.sm>
                  <Dropdown>
                    <Dropdown.Trigger
                      aria-label="Add"
                      className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary [&>svg]:size-4"
                    >
                      <Plus />
                    </Dropdown.Trigger>
                    <Dropdown.Panel placement="bottom-end">
                      <Dropdown.Item onClick={() => actions.createTemplate('slides')}>
                        New presentation template
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => actions.createTemplate('lyrics')}>
                        New lyric template
                      </Dropdown.Item>
                    </Dropdown.Panel>
                  </Dropdown>
                </LumaCastPanel.GroupTitle>
                <LumaCastPanel.Content>
                  {state.templates.length === 0 ? (
                    <EmptyState.Root>
                      <EmptyState.Title>No templates yet</EmptyState.Title>
                      <EmptyState.Description>Click the + button to create your first template.</EmptyState.Description>
                    </EmptyState.Root>
                  ) : (
                    <ScrollArea.Root>
                      <ScrollArea.Viewport className="p-2">
                        <div className="grid min-w-0 grid-cols-1 content-start gap-1" role="grid" aria-label="Templates">
                          {state.templates.map((template, index) => (
                            <TemplateListItem key={template.id} template={template} index={index} isActive={template.id === state.currentTemplateId} />
                          ))}
                        </div>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar>
                        <ScrollArea.Thumb />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  )}
                </LumaCastPanel.Content>
              </LumaCastPanel.Group>
            </SplitPanel.Segment>
            <SplitPanel.Segment id="template-objects" defaultSize={220} minSize={160}>
              <LumaCastPanel.Group>
                <LumaCastPanel.GroupTitle className="border-t">
                  <Label.xs className="mr-auto">Layers</Label.xs>
                </LumaCastPanel.GroupTitle>
                <LumaCastPanel.Content className="overflow-y-auto p-2">
                  <TemplateEditorLayersPanel />
                </LumaCastPanel.Content>
              </LumaCastPanel.Group>
            </SplitPanel.Segment>
          </SplitPanel.Panel>
        </LumaCastPanel.Root>
      </SplitPanel.Segment>
      <SplitPanel.Segment id="editor-center" defaultSize={840} minSize={360}>
        <StagePanel />
      </SplitPanel.Segment>
      <SplitPanel.Segment id="editor-right" defaultSize={320} minSize={140} collapsible>
        <TemplateEditorInspectorPanel />
      </SplitPanel.Segment>
    </SplitPanel.Panel>
  );
}

function TemplateListItem({
  template,
  index,
  isActive,
}: {
  template: ReturnType<typeof useTemplateEditorScreen>['state']['templates'][number];
  index: number;
  isActive: boolean;
}) {
  const { actions } = useTemplateEditorScreen();
  const scene = useMemo(() => buildRenderScene(null, template.elements), [template.elements]);

  function handleSelect() {
    actions.selectTemplate(template.id);
  }

  function handleCaptionDoubleClick(event: React.MouseEvent) {
    event.stopPropagation();
    actions.requestTemplateNameFocus(template.id);
  }

  return (
    <ActiveTemplateTile isActive={isActive} onClick={handleSelect} selected={isActive}>
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          <LazySceneStage scene={scene} surface="list" className="absolute inset-0" />
        </SceneFrame>
      </Thumbnail.Body>
      <Thumbnail.Caption>
        <div className="flex items-center gap-2" onDoubleClick={handleCaptionDoubleClick}>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <TemplateKindIcon kind={template.kind} />
          <span className="min-w-0 truncate text-sm text-tertiary">{template.name}</span>
        </div>
      </Thumbnail.Caption>
    </ActiveTemplateTile>
  );
}

function ActiveTemplateTile({ isActive, ...props }: React.ComponentProps<typeof Thumbnail.Tile> & { isActive: boolean }) {
  const ref = useScrollAreaActiveItem(isActive);
  return <Thumbnail.Tile ref={ref} {...props} />;
}

function TemplateKindIcon({ kind }: { kind: Template['kind'] }) {
  if (kind === 'lyrics') {
    return <Music size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
  }
  if (kind === 'overlays') {
    return <Layers size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
  }
  return <Presentation size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
}
