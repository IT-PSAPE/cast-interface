import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDefaultTemplateElements } from '@core/templates';
import type { AppSnapshot, Id, SlideElement, Template, TemplateKind } from '@core/types';
import { createId } from '../utils/create-id';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';
import { useWorkbench } from './workbench-context';

export type TemplateApplyTarget =
  | { type: 'presentation'; presentationId: Id }
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
  deleteTemplate: (templateId: Id) => void;
  duplicateTemplate: (templateId: Id) => void;
  renameTemplate: (templateId: Id, name: string) => void;
  pushChanges: () => Promise<Id | null>;
}

const TemplateEditorContext = createContext<TemplateEditorContextValue | null>(null);

export function TemplateEditorProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { workbenchMode } = useWorkbench();
  const { templates: persistedTemplates } = useProjectContent();
  const [currentTemplateId, setCurrentTemplateId] = useState<Id | null>(null);
  const [stagedTemplates, setStagedTemplates] = useState<Template[] | null>(null);
  const [isPushingChanges, setIsPushingChanges] = useState(false);
  const previousWorkbenchModeRef = useRef(workbenchMode);

  const templates = stagedTemplates ?? persistedTemplates;
  const hasPendingChanges = useMemo(() => {
    if (!stagedTemplates) return false;
    return templateCollectionSignature(stagedTemplates) !== templateCollectionSignature(persistedTemplates);
  }, [persistedTemplates, stagedTemplates]);

  useEffect(() => {
    if (templates.length === 0) {
      setCurrentTemplateId(null);
      return;
    }
    if (!currentTemplateId || !templates.some((template) => template.id === currentTemplateId)) {
      setCurrentTemplateId(templates[0]?.id ?? null);
    }
  }, [currentTemplateId, templates]);

  const currentTemplate = useMemo(
    () => templates.find((template) => template.id === currentTemplateId) ?? null,
    [currentTemplateId, templates],
  );

  const updateTemplateDraft = useCallback((input: { id: Id; name?: string; kind?: TemplateKind; elements?: SlideElement[] }) => {
    setStagedTemplates((current) => {
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
  }, [persistedTemplates]);

  const replaceTemplateElements = useCallback((elements: SlideElement[]) => {
    if (!currentTemplateId) return;
    updateTemplateDraft({ id: currentTemplateId, elements });
  }, [currentTemplateId, updateTemplateDraft]);

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
    setStagedTemplates((current) => [...(current ?? persistedTemplates), draft]);
    setCurrentTemplateId(draft.id);
    setStatusText('Created template');
  }, [persistedTemplates, setStatusText, templates]);

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
    setStagedTemplates((current) => [...(current ?? persistedTemplates), duplicate]);
    setCurrentTemplateId(duplicate.id);
    setStatusText('Duplicated template');
  }, [persistedTemplates, setStatusText, templates]);

  const renameTemplate = useCallback((templateId: Id, name: string) => {
    updateTemplateDraft({ id: templateId, name });
  }, [updateTemplateDraft]);

  const deleteTemplate = useCallback((templateId: Id) => {
    setStagedTemplates((current) => (current ?? persistedTemplates).filter((template) => template.id !== templateId));
    setCurrentTemplateId((current) => (current === templateId ? null : current));
    setStatusText('Deleted template');
  }, [persistedTemplates, setStatusText]);

  const openTemplateEditor = useCallback((templateId: Id) => {
    setCurrentTemplateId(templateId);
  }, []);

  const pushChanges = useCallback(async (): Promise<Id | null> => {
    if (!stagedTemplates || isPushingChanges) return currentTemplateId;
    if (templateCollectionSignature(stagedTemplates) === templateCollectionSignature(persistedTemplates)) {
      setStagedTemplates(null);
      return currentTemplateId;
    }

    setIsPushingChanges(true);
    try {
      let resolvedCurrentTemplateId = currentTemplateId;
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

      setStagedTemplates(null);
      const currentTemplateStillExists = resolvedCurrentTemplateId
        ? next.templates.some((template) => template.id === resolvedCurrentTemplateId)
        : false;
      if (!resolvedCurrentTemplateId || !currentTemplateStillExists) {
        resolvedCurrentTemplateId = next.templates[0]?.id ?? null;
      }
      setCurrentTemplateId(resolvedCurrentTemplateId);
      setStatusText('Template changes pushed');
      return resolvedCurrentTemplateId;
    } finally {
      setIsPushingChanges(false);
    }
  }, [currentTemplateId, isPushingChanges, mutate, persistedTemplates, setStatusText, stagedTemplates]);

  const applyTemplateToTarget = useCallback(async (templateId: Id, target: TemplateApplyTarget) => {
    let resolvedTemplateId = templateId;
    if (currentTemplateId === templateId) {
      resolvedTemplateId = await pushChanges() ?? templateId;
    } else if (hasPendingChanges) {
      await pushChanges();
    }
    if (!resolvedTemplateId) return;
    if (target.type === 'presentation') {
      await mutate(() => window.castApi.applyTemplateToPresentation(resolvedTemplateId, target.presentationId));
      setStatusText('Applied template to presentation');
      return;
    }
    await mutate(() => window.castApi.applyTemplateToOverlay(resolvedTemplateId, target.overlayId));
    setStatusText('Applied template to overlay');
  }, [currentTemplateId, hasPendingChanges, mutate, pushChanges, setStatusText]);

  useEffect(() => {
    const previousWorkbenchMode = previousWorkbenchModeRef.current;
    previousWorkbenchModeRef.current = workbenchMode;
    if (previousWorkbenchMode !== 'template-editor' || workbenchMode === 'template-editor') return;
    if (!hasPendingChanges || isPushingChanges) return;
    void pushChanges();
  }, [hasPendingChanges, isPushingChanges, pushChanges, workbenchMode]);

  const value = useMemo<TemplateEditorContextValue>(() => ({
    templates,
    currentTemplateId,
    currentTemplate,
    hasPendingChanges,
    isPushingChanges,
    setCurrentTemplateId,
    openTemplateEditor,
    updateTemplateDraft,
    replaceTemplateElements,
    createTemplate,
    applyTemplateToTarget,
    deleteTemplate,
    duplicateTemplate,
    renameTemplate,
    pushChanges,
  }), [
    applyTemplateToTarget,
    createTemplate,
    currentTemplate,
    currentTemplateId,
    deleteTemplate,
    duplicateTemplate,
    hasPendingChanges,
    isPushingChanges,
    openTemplateEditor,
    pushChanges,
    renameTemplate,
    replaceTemplateElements,
    setCurrentTemplateId,
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

function cloneElements(elements: SlideElement[]): SlideElement[] {
  return JSON.parse(JSON.stringify(elements)) as SlideElement[];
}

function cloneTemplate(template: Template): Template {
  return JSON.parse(JSON.stringify(template)) as Template;
}

function templateCollectionSignature(templates: Template[]): string {
  return JSON.stringify(templates.map(templateSignature));
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
