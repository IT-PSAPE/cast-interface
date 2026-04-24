import { useMemo } from 'react';
import type { Id, Template } from '@core/types';
import type { ContextMenuItem } from '../../../components/overlays/context-menu';
import { useNavigation } from '../../../contexts/navigation-context';
import { useOverlayEditor, useTemplateEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useContextMenuState } from '../../../hooks/use-context-menu-state';
import { filterByText } from '../../../utils/filter-by-text';
import { compareByKey, useTemplateBinSort } from '../../workbench/use-bin-sort';

export function useTemplateBin(filterText: string) {
  const { currentPlaylistDeckItem, currentDeckItem } = useNavigation();
  const { currentOverlay } = useOverlayEditor();
  const { state: { workbenchMode }, actions: { setWorkbenchMode } } = useWorkbench();
  const {
    templates,
    applyTemplateToTarget,
    currentTemplateId,
    deleteTemplate,
    duplicateTemplate,
    openTemplateEditor,
    renameTemplate,
  } = useTemplateEditor();
  const menu = useContextMenuState<Id>();
  const { sort } = useTemplateBinSort();

  const filteredTemplates = useMemo(() => {
    const filtered = filterByText(templates, filterText, (t) => [t.name, t.kind]);
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => direction * compareByKey(a, b, sort.key, (item) => item.name));
  }, [templates, filterText, sort]);
  const activeDeckItem = currentPlaylistDeckItem ?? currentDeckItem;

  function resolvePreviewTarget(template: Template) {
    if (template.kind === 'overlays' && workbenchMode === 'overlay-editor' && currentOverlay) {
      return { type: 'overlay' as const, overlayId: currentOverlay.id };
    }
    if (!activeDeckItem) return null;
    if (template.kind === 'lyrics' && activeDeckItem.type === 'lyric') {
      return { type: 'deck-item' as const, itemId: activeDeckItem.id };
    }
    if (template.kind === 'slides' && activeDeckItem.type === 'presentation') {
      return { type: 'deck-item' as const, itemId: activeDeckItem.id };
    }
    return null;
  }

  function handleOpenTemplate(template: Template) {
    openTemplateEditor(template.id);
    setWorkbenchMode('template-editor');
  }

  function handleApplyTemplate(template: Template) {
    const target = resolvePreviewTarget(template);
    if (!target) return;
    void applyTemplateToTarget(template.id, target);
  }

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu.menuState) return [];
    const template = templates.find((item) => item.id === menu.menuState!.data) ?? null;
    if (!template) return [];
    const previewTarget = resolvePreviewTarget(template);
    return [
      {
        id: 'apply-template',
        label: previewTarget?.type === 'overlay'
          ? 'Apply to Current Overlay'
          : 'Apply and Assign to Current Item',
        disabled: !previewTarget,
        onSelect: () => handleApplyTemplate(template),
      },
      { id: 'edit-template', label: 'Edit Template', onSelect: () => handleOpenTemplate(template) },
      {
        id: 'rename-template', label: 'Rename', onSelect: () => {
          const nextName = window.prompt('Rename template', template.name)?.trim();
          if (!nextName) return;
          renameTemplate(template.id, nextName);
        }
      },
      { id: 'duplicate-template', label: 'Duplicate', onSelect: () => duplicateTemplate(template.id) },
      {
        id: 'delete-template', label: 'Delete', danger: true, onSelect: () => {
          if (!window.confirm('Delete this template?')) return;
          deleteTemplate(template.id);
        }
      },
    ];
  }, [menu.menuState, templates]);

  return { filteredTemplates, menu, menuItems, currentTemplateId, handleOpenTemplate };
}
