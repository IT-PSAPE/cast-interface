import { useMemo, useState } from 'react';
import type { Id, Template } from '@core/types';
import { ContextMenu, type ContextMenuItem } from '../../../components/context-menu';
import { useNavigation } from '../../../contexts/navigation-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useWorkbench } from '../../../contexts/workbench-context';
import { TemplateCard } from '../../template-editor/components/template-card';

interface TemplateBinPanelProps {
  filterText: string;
}

interface MenuState {
  templateId: Id;
  x: number;
  y: number;
}

export function TemplateBinPanel({ filterText }: TemplateBinPanelProps) {
  const { templates } = useProjectContent();
  const { currentPlaylistPresentation, currentPresentation } = useNavigation();
  const { currentOverlay } = useOverlayEditor();
  const { workbenchMode, setWorkbenchMode } = useWorkbench();
  const {
    applyTemplateToTarget,
    currentTemplateId,
    deleteTemplate,
    duplicateTemplate,
    openTemplateEditor,
    renameTemplate,
  } = useTemplateEditor();
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (!normalizedFilter) return true;
      return template.name.toLowerCase().includes(normalizedFilter) || template.kind.toLowerCase().includes(normalizedFilter);
    });
  }, [normalizedFilter, templates]);

  const activePresentation = currentPlaylistPresentation ?? currentPresentation;

  function resolvePreviewTarget(template: Template) {
    if (template.kind === 'overlays' && workbenchMode === 'overlay-editor' && currentOverlay) {
      return { type: 'overlay' as const, overlayId: currentOverlay.id };
    }
    if (!activePresentation) return null;
    if (template.kind === 'lyrics' && activePresentation.kind === 'lyrics') {
      return { type: 'presentation' as const, presentationId: activePresentation.id };
    }
    if (template.kind === 'slides' && activePresentation.kind === 'canvas') {
      return { type: 'presentation' as const, presentationId: activePresentation.id };
    }
    return null;
  }

  function openMenu(templateId: Id, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    setMenuState({ templateId, x: rect.left, y: rect.bottom + 4 });
  }

  function closeMenu() {
    setMenuState(null);
  }

  function handleOpenTemplate(template: Template) {
    openTemplateEditor(template.id);
    setWorkbenchMode('template-editor');
  }

  function handleEditTemplate(template: Template) {
    openTemplateEditor(template.id);
    setWorkbenchMode('template-editor');
  }

  function handleApplyTemplate(template: Template) {
    const nextPreviewTarget = resolvePreviewTarget(template);
    if (!nextPreviewTarget) return;
    void applyTemplateToTarget(template.id, nextPreviewTarget);
  }

  function handleRenameTemplate(template: Template) {
    const nextName = window.prompt('Rename template', template.name)?.trim();
    if (!nextName) return;
    renameTemplate(template.id, nextName);
  }

  function handleDuplicateTemplate(template: Template) {
    duplicateTemplate(template.id);
  }

  function handleDeleteTemplate(template: Template) {
    if (!window.confirm('Delete this template?')) return;
    deleteTemplate(template.id);
  }

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menuState) return [];
    const template = templates.find((item) => item.id === menuState.templateId) ?? null;
    if (!template) return [];
    const previewTarget = resolvePreviewTarget(template);
    return [
      {
        id: 'apply-template',
        label: previewTarget?.type === 'overlay'
          ? 'Apply to Current Overlay'
          : 'Apply and Assign to Current Presentation',
        disabled: !previewTarget,
        onSelect: () => handleApplyTemplate(template),
      },
      { id: 'edit-template', label: 'Edit Template', onSelect: () => handleEditTemplate(template) },
      { id: 'rename-template', label: 'Rename', onSelect: () => handleRenameTemplate(template) },
      { id: 'duplicate-template', label: 'Duplicate', onSelect: () => handleDuplicateTemplate(template) },
      { id: 'delete-template', label: 'Delete', danger: true, onSelect: () => handleDeleteTemplate(template) },
    ];
  }, [menuState, templates]);

  function renderTemplateCard(template: Template) {
    function handleOpen() {
      handleOpenTemplate(template);
    }

    function handleEdit() {
      handleEditTemplate(template);
    }

    function handleOpenMenu(button: HTMLButtonElement) {
      openMenu(template.id, button);
    }

    return (
      <TemplateCard
        key={template.id}
        template={template}
        selected={template.id === currentTemplateId}
        onClick={handleOpen}
        onDoubleClick={handleEdit}
        onOpenMenu={handleOpenMenu}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">{filteredTemplates.map(renderTemplateCard)}</div>
      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </>
  );
}
