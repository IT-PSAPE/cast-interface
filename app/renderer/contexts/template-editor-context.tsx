import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createDefaultTemplateElements } from '@core/templates';
import type { AppSnapshot, Id, SlideElement, Template, TemplateKind } from '@core/types';
import { cloneElements } from '../utils/staged-editor-utils';
import { createId } from '../utils/create-id';
import { useStagedCollection } from '../hooks/use-staged-collection';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';
import { useWorkbench } from './workbench-context';

export type TemplateApplyTarget =
  | { type: 'deck-item'; itemId: Id }
  | { type: 'overlay'; overlayId: Id };

interface TemplateEditorContextValue {
  templates: Template[];
  currentTemplateId: Id | null;
  currentTemplate: Template | null;
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  setCurrentTemplateId: (templateId: Id | null) => void;
  openTemplateEditor: (templateId: Id) => void;
  updateTemplateDraft: (input: { id: Id; name?: string; kind?: TemplateKind; elements?: SlideElement[] }) => void;
  replaceTemplateElements: (elements: SlideElement[]) => void;
  createTemplate: (kind: TemplateKind) => void;
  applyTemplateToTarget: (templateId: Id, target: TemplateApplyTarget) => Promise<void>;
  resetDeckItemToAssignedTemplate: (itemId: Id) => Promise<void>;
  deleteTemplate: (templateId: Id) => void;
  duplicateTemplate: (templateId: Id) => void;
  renameTemplate: (templateId: Id, name: string) => void;
  pushChanges: () => Promise<Id | null>;
}

const TemplateEditorContext = createContext<TemplateEditorContextValue | null>(null);

export function TemplateEditorProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { state: { workbenchMode } } = useWorkbench();
  const { deckItemsById, templates: persistedTemplates } = useProjectContent();

  const staged = useStagedCollection<Template>({
    persistedItems: persistedTemplates,
    signatureOf: templateSignature,
    workbenchModeKey: 'template-editor',
    currentWorkbenchMode: workbenchMode,
  });

  const templates = staged.items;

  const updateTemplateDraft = useCallback((input: { id: Id; name?: string; kind?: TemplateKind; elements?: SlideElement[] }) => {
    staged.setStagedItems((current) => {
      const source = current ?? persistedTemplates;
      return source.map((template) => (
        template.id === input.id
          ? {
            ...template,
            name: input.name ?? template.name,
            kind: input.kind ?? template.kind,
            elements: input.elements ? cloneElements(input.elements) : template.elements,
            updatedAt: new Date().toISOString(),
          }
          : template
      ));
    });
  }, [persistedTemplates, staged]);

  const replaceTemplateElements = useCallback((elements: SlideElement[]) => {
    if (!staged.currentItemId) return;
    updateTemplateDraft({ id: staged.currentItemId, elements });
  }, [staged.currentItemId, updateTemplateDraft]);

  const createTemplate = useCallback((kind: TemplateKind) => {
    const now = new Date().toISOString();
    const id = createId();
    const draft: Template = {
      id,
      name: kind === 'lyrics' ? 'New Lyric Template' : kind === 'overlays' ? 'New Overlay Template' : 'New Slide Template',
      kind,
      width: 1920,
      height: 1080,
      order: (templates.at(-1)?.order ?? -1) + 1,
      elements: createDefaultTemplateElements(kind, id, now),
      createdAt: now,
      updatedAt: now,
    };
    staged.setStagedItems((current) => [...(current ?? persistedTemplates), draft]);
    staged.setCurrentItemId(draft.id);
    setStatusText('Created template');
  }, [persistedTemplates, setStatusText, staged, templates]);

  const duplicateTemplate = useCallback((templateId: Id) => {
    const sourceTemplate = templates.find((template) => template.id === templateId) ?? null;
    if (!sourceTemplate) return;
    const now = new Date().toISOString();
    const duplicate: Template = {
      ...cloneTemplate(sourceTemplate),
      id: createId(),
      name: `${sourceTemplate.name} Copy`,
      order: (templates.at(-1)?.order ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    staged.setStagedItems((current) => [...(current ?? persistedTemplates), duplicate]);
    staged.setCurrentItemId(duplicate.id);
    setStatusText('Duplicated template');
  }, [persistedTemplates, setStatusText, staged, templates]);

  const renameTemplate = useCallback((templateId: Id, name: string) => {
    updateTemplateDraft({ id: templateId, name });
  }, [updateTemplateDraft]);

  const deleteTemplate = useCallback((templateId: Id) => {
    staged.setStagedItems((current) => (current ?? persistedTemplates).filter((template) => template.id !== templateId));
    staged.setCurrentItemId((current) => (current === templateId ? null : current));
    setStatusText('Deleted template');
  }, [persistedTemplates, setStatusText, staged]);

  const openTemplateEditor = useCallback((templateId: Id) => {
    staged.setCurrentItemId(templateId);
  }, [staged]);

  const pushChanges = useCallback(async (): Promise<Id | null> => {
    if (!staged.stagedItems || staged.isPushingChanges) return staged.currentItemId;
    const stagedTemplates = staged.stagedItems;
    const stagedSig = stagedTemplates.map(templateSignature).join();
    const persistedSig = persistedTemplates.map(templateSignature).join();
    if (stagedSig === persistedSig) {
      staged.setStagedItems(null);
      return staged.currentItemId;
    }

    staged.setIsPushingChanges(true);
    try {
      let resolvedCurrentTemplateId = staged.currentItemId;
      const next = await mutate(async () => {
        let snapshot: AppSnapshot | null = null;
        let knownTemplates = persistedTemplates;
        const persistedById = new Map(persistedTemplates.map((template) => [template.id, template]));
        const stagedById = new Map(stagedTemplates.map((template) => [template.id, template]));

        for (const template of persistedTemplates) {
          if (stagedById.has(template.id)) continue;
          snapshot = await window.castApi.deleteTemplate(template.id);
          knownTemplates = snapshot.templates;
        }

        for (const template of stagedTemplates) {
          if (persistedById.has(template.id)) continue;
          const previousIds = new Set(knownTemplates.map((item) => item.id));
          snapshot = await window.castApi.createTemplate({
            name: template.name,
            kind: template.kind,
            width: template.width,
            height: template.height,
            elements: cloneElements(template.elements),
          });
          knownTemplates = snapshot.templates;
          const createdTemplate = knownTemplates.find((item) => !previousIds.has(item.id)) ?? null;
          if (createdTemplate && resolvedCurrentTemplateId === template.id) {
            resolvedCurrentTemplateId = createdTemplate.id;
          }
        }

        for (const template of stagedTemplates) {
          if (!persistedById.has(template.id)) continue;
          const persistedTemplate = persistedById.get(template.id);
          if (!persistedTemplate || templateSignature(template) === templateSignature(persistedTemplate)) continue;
          snapshot = await window.castApi.updateTemplate({
            id: template.id,
            name: template.name,
            kind: template.kind,
            width: template.width,
            height: template.height,
            elements: cloneElements(template.elements),
          });
          knownTemplates = snapshot.templates;
        }

        if (snapshot) return snapshot;
        return window.castApi.getSnapshot();
      });

      staged.setStagedItems(null);
      const currentTemplateStillExists = resolvedCurrentTemplateId
        ? next.templates.some((template) => template.id === resolvedCurrentTemplateId)
        : false;
      if (!resolvedCurrentTemplateId || !currentTemplateStillExists) {
        resolvedCurrentTemplateId = next.templates[0]?.id ?? null;
      }
      staged.setCurrentItemId(resolvedCurrentTemplateId);
      setStatusText('Template changes pushed');
      return resolvedCurrentTemplateId;
    } finally {
      staged.setIsPushingChanges(false);
    }
  }, [staged, mutate, persistedTemplates, setStatusText]);

  const resolveTemplateIdForMutation = useCallback(async (templateId: Id): Promise<Id | null> => {
    if (staged.currentItemId === templateId) {
      return await pushChanges() ?? templateId;
    }
    if (staged.hasPendingChanges) {
      await pushChanges();
    }
    return templateId;
  }, [staged.currentItemId, staged.hasPendingChanges, pushChanges]);

  const applyTemplateToTarget = useCallback(async (templateId: Id, target: TemplateApplyTarget) => {
    const resolvedTemplateId = await resolveTemplateIdForMutation(templateId);
    if (!resolvedTemplateId) return;
    if (target.type === 'deck-item') {
      await mutate(() => window.castApi.applyTemplateToDeckItem(resolvedTemplateId, target.itemId));
      setStatusText('Applied template to item');
      return;
    }
    await mutate(() => window.castApi.applyTemplateToOverlay(resolvedTemplateId, target.overlayId));
    setStatusText('Applied template to overlay');
  }, [mutate, resolveTemplateIdForMutation, setStatusText]);

  const resetDeckItemToAssignedTemplate = useCallback(async (itemId: Id) => {
    const deckItem = deckItemsById.get(itemId) ?? null;
    const templateId = deckItem?.templateId ?? null;
    if (!templateId) return;
    const resolvedTemplateId = await resolveTemplateIdForMutation(templateId);
    if (!resolvedTemplateId) return;
    await mutate(() => window.castApi.resetDeckItemToTemplate(itemId));
    setStatusText('Reset item to template');
  }, [deckItemsById, mutate, resolveTemplateIdForMutation, setStatusText]);

  useEffect(() => {
    staged.registerAutoPush(() => void pushChanges());
  }, [staged, pushChanges]);

  const value = useMemo<TemplateEditorContextValue>(() => ({
    templates,
    currentTemplateId: staged.currentItemId,
    currentTemplate: staged.currentItem,
    hasPendingChanges: staged.hasPendingChanges,
    isPushingChanges: staged.isPushingChanges,
    setCurrentTemplateId: staged.setCurrentItemId,
    openTemplateEditor,
    updateTemplateDraft,
    replaceTemplateElements,
    createTemplate,
    applyTemplateToTarget,
    resetDeckItemToAssignedTemplate,
    deleteTemplate,
    duplicateTemplate,
    renameTemplate,
    pushChanges,
  }), [
    applyTemplateToTarget,
    createTemplate,
    staged.currentItem,
    staged.currentItemId,
    deleteTemplate,
    duplicateTemplate,
    staged.hasPendingChanges,
    staged.isPushingChanges,
    openTemplateEditor,
    pushChanges,
    renameTemplate,
    resetDeckItemToAssignedTemplate,
    replaceTemplateElements,
    staged.setCurrentItemId,
    templates,
    updateTemplateDraft,
  ]);

  return <TemplateEditorContext.Provider value={value}>{children}</TemplateEditorContext.Provider>;
}

export function useTemplateEditor(): TemplateEditorContextValue {
  const context = useContext(TemplateEditorContext);
  if (!context) throw new Error('useTemplateEditor must be used within TemplateEditorProvider');
  return context;
}

function cloneTemplate(template: Template): Template {
  return JSON.parse(JSON.stringify(template)) as Template;
}

function templateSignature(template: Template): string {
  return JSON.stringify({
    id: template.id,
    name: template.name,
    kind: template.kind,
    width: template.width,
    height: template.height,
    elements: template.elements,
  });
}
