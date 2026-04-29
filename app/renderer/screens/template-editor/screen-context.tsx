import { useMemo, useState, type ReactNode } from 'react';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { getEditorHeaderActions } from '../../features/workbench/editor-header-actions';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { createScreenContext } from '../../contexts/create-screen-context';

interface TemplateEditorScreenContextValue {
  meta: {
    screenId: 'template-editor';
    listTitle: 'Templates';
    addActions: ReturnType<typeof getEditorHeaderActions>;
  };
  state: {
    templates: ReturnType<typeof useTemplateEditor>['templates'];
    currentTemplateId: ReturnType<typeof useTemplateEditor>['currentTemplateId'];
    currentTemplate: ReturnType<typeof useTemplateEditor>['currentTemplate'];
    hasPendingChanges: boolean;
    linkedItemCount: number;
    isSyncing: boolean;
  };
  actions: {
    selectTemplate: (id: string) => void;
    requestTemplateNameFocus: (id: string) => void;
    createTemplate: ReturnType<typeof useTemplateEditor>['createTemplate'];
    syncLinkedItems: () => Promise<void>;
  };
}

const [TemplateEditorScreenContextProvider, useTemplateEditorScreen] = createScreenContext<TemplateEditorScreenContextValue>('TemplateEditorScreenContext');

export function TemplateEditorScreenProvider({ children }: { children: ReactNode }) {
  const {
    templates,
    currentTemplateId,
    currentTemplate,
    hasPendingChanges,
    openTemplateEditor,
    requestNameFocus,
    syncLinkedDeckItems,
    createTemplate,
  } = useTemplateEditor();
  const { deckItems } = useProjectContent();
  const [isSyncing, setIsSyncing] = useState(false);
  const addActions = useMemo(() => getEditorHeaderActions('template-editor'), []);

  const linkedItemCount = currentTemplate
    ? deckItems.filter((item) => item.templateId === currentTemplate.id && isTemplateCompatibleWithDeckItem(currentTemplate, item.type)).length
    : 0;

  useEditorLeftPanelNav({
    items: templates,
    currentId: currentTemplateId,
    activate: (id) => openTemplateEditor(id),
  });

  async function handleSyncLinkedItems() {
    if (!currentTemplate || linkedItemCount === 0) return;
    setIsSyncing(true);
    try {
      await syncLinkedDeckItems(currentTemplate.id);
    } finally {
      setIsSyncing(false);
    }
  }

  const value = useMemo<TemplateEditorScreenContextValue>(() => ({
    meta: {
      screenId: 'template-editor',
      listTitle: 'Templates',
      addActions,
    },
    state: {
      templates,
      currentTemplateId,
      currentTemplate,
      hasPendingChanges,
      linkedItemCount,
      isSyncing,
    },
    actions: {
      selectTemplate: openTemplateEditor,
      requestTemplateNameFocus: requestNameFocus,
      createTemplate,
      syncLinkedItems: handleSyncLinkedItems,
    },
  }), [
    addActions,
    createTemplate,
    currentTemplate,
    currentTemplateId,
    hasPendingChanges,
    isSyncing,
    linkedItemCount,
    openTemplateEditor,
    requestNameFocus,
    templates,
  ]);

  return <TemplateEditorScreenContextProvider value={value}>{children}</TemplateEditorScreenContextProvider>;
}

export { useTemplateEditorScreen };
