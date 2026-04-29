import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { createScreenContext } from '../../contexts/create-screen-context';

interface TemplateEditorScreenContextValue {
  state: {
    templates: ReturnType<typeof useTemplateEditor>['templates'];
    currentTemplateId: ReturnType<typeof useTemplateEditor>['currentTemplateId'];
    currentTemplate: ReturnType<typeof useTemplateEditor>['currentTemplate'];
    hasPendingChanges: boolean;
    isPushingChanges: boolean;
    linkedItemCount: number;
    isSyncing: boolean;
  };
  actions: {
    selectTemplate: (id: string) => void;
    requestTemplateNameFocus: (id: string) => void;
    createTemplate: ReturnType<typeof useTemplateEditor>['createTemplate'];
    saveChanges: () => Promise<void>;
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
    isPushingChanges,
    openTemplateEditor,
    requestNameFocus,
    syncLinkedDeckItems,
    createTemplate,
    pushChanges,
  } = useTemplateEditor();
  const { commitProgramScene } = useRenderScenes();
  const { deckItems } = useProjectContent();
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSaveChanges = useCallback(async () => {
    if (!hasPendingChanges) return;
    await pushChanges();
    commitProgramScene();
  }, [commitProgramScene, hasPendingChanges, pushChanges]);

  const value = useMemo<TemplateEditorScreenContextValue>(() => ({
    state: {
      templates,
      currentTemplateId,
      currentTemplate,
      hasPendingChanges,
      isPushingChanges,
      linkedItemCount,
      isSyncing,
    },
    actions: {
      selectTemplate: openTemplateEditor,
      requestTemplateNameFocus: requestNameFocus,
      createTemplate,
      saveChanges: handleSaveChanges,
      syncLinkedItems: handleSyncLinkedItems,
    },
  }), [
    createTemplate,
    currentTemplate,
    currentTemplateId,
    hasPendingChanges,
    handleSaveChanges,
    isPushingChanges,
    isSyncing,
    linkedItemCount,
    openTemplateEditor,
    requestNameFocus,
    templates,
  ]);

  return <TemplateEditorScreenContextProvider value={value}>{children}</TemplateEditorScreenContextProvider>;
}

export { useTemplateEditorScreen };
