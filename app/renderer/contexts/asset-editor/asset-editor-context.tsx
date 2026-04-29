import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDefaultTemplateElements } from '@core/templates';
import type { Id, Overlay, OverlayCreateInput, OverlayUpdateInput, SlideElement, Stage, Template, TemplateKind } from '@core/types';
import { cloneElements, slideElementsSignature } from '../../utils/staged-editor-utils';
import { getOverlayDefaults } from '../../utils/slides';
import { createId } from '../../utils/create-id';
import { useStagedCollection } from '../../hooks/use-staged-collection';
import { buildSnapshotDiff } from '../element/element-history-utils';
import { useCast } from '../app-context';
import { useProjectContent } from '../use-project-content';
import { useWorkbench } from '../workbench-context';

// ─── Types ──────────────────────────────────────────────────────────

export type TemplateApplyTarget =
  | { type: 'deck-item'; itemId: Id }
  | { type: 'overlay'; overlayId: Id };

interface OverlayEditorValue {
  overlays: Overlay[];
  currentOverlayId: Id | null;
  currentOverlay: Overlay | null;
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  nameFocusRequest: number;
  setCurrentOverlayId: (overlayId: Id | null) => void;
  updateOverlayDraft: (input: OverlayUpdateInput) => void;
  createOverlay: () => Promise<void>;
  duplicateOverlay: (overlayId: Id) => void;
  deleteCurrentOverlay: () => Promise<void>;
  requestNameFocus: (overlayId: Id) => void;
  pushChanges: () => Promise<void>;
}

interface TemplateEditorValue {
  templates: Template[];
  currentTemplateId: Id | null;
  currentTemplate: Template | null;
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  nameFocusRequest: number;
  setCurrentTemplateId: (templateId: Id | null) => void;
  openTemplateEditor: (templateId: Id) => void;
  updateTemplateDraft: (input: { id: Id; name?: string; kind?: TemplateKind; elements?: SlideElement[] }) => void;
  replaceTemplateElements: (elements: SlideElement[]) => void;
  createTemplate: (kind: TemplateKind) => void;
  applyTemplateToTarget: (templateId: Id, target: TemplateApplyTarget) => Promise<void>;
  detachTemplateFromDeckItem: (itemId: Id) => Promise<void>;
  syncLinkedDeckItems: (templateId: Id) => Promise<void>;
  deleteTemplate: (templateId: Id) => void;
  duplicateTemplate: (templateId: Id) => void;
  renameTemplate: (templateId: Id, name: string) => void;
  requestNameFocus: (templateId: Id) => void;
  pushChanges: () => Promise<Id | null>;
}

interface DeckEditorValue {
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  getSlideElements: (slideId: Id) => SlideElement[];
  replaceSlideElements: (slideId: Id, elements: SlideElement[]) => void;
  pushChanges: () => Promise<void>;
}

interface StageEditorValue {
  stages: Stage[];
  currentStageId: Id | null;
  currentStage: Stage | null;
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  nameFocusRequest: number;
  setCurrentStageId: (stageId: Id | null) => void;
  updateStageDraft: (input: { id: Id; name?: string; elements?: SlideElement[] }) => void;
  replaceStageElements: (elements: SlideElement[]) => void;
  createStage: () => Promise<void>;
  duplicateStage: (stageId: Id) => void;
  deleteCurrentStage: () => Promise<void>;
  requestNameFocus: (stageId: Id) => void;
  pushChanges: () => Promise<void>;
}

interface AssetEditorContextValue {
  overlay: OverlayEditorValue;
  template: TemplateEditorValue;
  deck: DeckEditorValue;
  stage: StageEditorValue;
}

// ─── Context ────────────────────────────────────────────────────────

const OverlayEditorContext = createContext<OverlayEditorValue | null>(null);
const TemplateEditorContext = createContext<TemplateEditorValue | null>(null);
const DeckEditorContext = createContext<DeckEditorValue | null>(null);
const StageEditorContext = createContext<StageEditorValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────

export function AssetEditorProvider({ children }: { children: ReactNode }) {
  const { mutatePatch, setStatusText } = useCast();
  const { state: { workbenchMode, overlayDefaults } } = useWorkbench();
  const {
    overlays: persistedOverlays,
    templates: persistedTemplates,
    stages: persistedStages,
    slideElementsBySlideId,
  } = useProjectContent();

  // ── Overlay editor ──

  const overlayStaged = useStagedCollection<Overlay>({
    persistedItems: persistedOverlays,
    signatureOf: overlaySignature,
    workbenchModeKey: 'overlay-editor',
    currentWorkbenchMode: workbenchMode,
  });

  const overlays = overlayStaged.items;
  const [overlayNameFocusRequest, setOverlayNameFocusRequest] = useState(0);

  const updateOverlayDraft = useCallback((input: OverlayUpdateInput) => {
    overlayStaged.setStagedItems((current) => {
      const source = current ?? persistedOverlays;
      return source.map((overlay) => {
        if (overlay.id !== input.id) return overlay;
        const nextElements = typeof input.elements === 'undefined' ? overlay.elements : cloneElements(input.elements);
        return {
          ...overlay,
          name: input.name ?? overlay.name,
          elements: nextElements,
          animation: input.animation ?? overlay.animation,
          updatedAt: new Date().toISOString(),
        };
      });
    });
  }, [persistedOverlays, overlayStaged]);

  const createOverlayAction = useCallback(async () => {
    const now = new Date().toISOString();
    const draft: Overlay = {
      id: createId(),
      type: 'text',
      x: 0, y: 0, width: 1920, height: 1080, opacity: 1, zIndex: 0, enabled: true,
      payload: { text: '', fontFamily: 'Avenir Next', fontSize: 48, color: '#FFFFFF', alignment: 'left', weight: '700' },
      createdAt: now, updatedAt: now,
      ...getOverlayDefaults({
        animationKind: overlayDefaults.animationKind,
        durationMs: overlayDefaults.durationMs,
        autoClearDurationMs: overlayDefaults.autoClearDurationMs,
      }),
    };
    overlayStaged.setStagedItems((current) => [...(current ?? persistedOverlays), draft]);
    overlayStaged.setCurrentItemId(draft.id);
    setStatusText('Created overlay');
  }, [overlayDefaults.autoClearDurationMs, overlayDefaults.animationKind, overlayDefaults.durationMs, persistedOverlays, setStatusText, overlayStaged]);

  const deleteCurrentOverlay = useCallback(async () => {
    if (!overlayStaged.currentItemId) return;
    overlayStaged.setStagedItems((current) => {
      const source = current ?? persistedOverlays;
      return source.filter((overlay) => overlay.id !== overlayStaged.currentItemId);
    });
    setStatusText('Deleted overlay');
  }, [overlayStaged, persistedOverlays, setStatusText]);

  const duplicateOverlayAction = useCallback((overlayId: Id) => {
    const source = overlays.find((overlay) => overlay.id === overlayId);
    if (!source) return;
    const now = new Date().toISOString();
    const duplicate: Overlay = {
      ...cloneOverlay(source),
      id: createId(),
      name: `${source.name} Copy`,
      createdAt: now,
      updatedAt: now,
    };
    overlayStaged.setStagedItems((current) => [...(current ?? persistedOverlays), duplicate]);
    overlayStaged.setCurrentItemId(duplicate.id);
    setStatusText('Duplicated overlay');
  }, [overlays, overlayStaged, persistedOverlays, setStatusText]);

  const requestOverlayNameFocus = useCallback((overlayId: Id) => {
    overlayStaged.setCurrentItemId(overlayId);
    setOverlayNameFocusRequest((v) => v + 1);
  }, [overlayStaged]);

  const pushOverlayChanges = useCallback(async () => {
    if (!overlayStaged.stagedItems || overlayStaged.isPushingChanges) return;
    const stagedOverlays = overlayStaged.stagedItems;
    const stagedSig = stagedOverlays.map(overlaySignature).join();
    const persistedSig = persistedOverlays.map(overlaySignature).join();
    if (stagedSig === persistedSig) {
      overlayStaged.setStagedItems(null);
      return;
    }

    overlayStaged.setIsPushingChanges(true);
    try {
      let resolvedCurrentOverlayId = overlayStaged.currentItemId;
      let knownOverlays = persistedOverlays;
        const persistedById = new Map(persistedOverlays.map((o) => [o.id, o]));
        const stagedById = new Map(stagedOverlays.map((o) => [o.id, o]));

        for (const overlay of persistedOverlays) {
          if (stagedById.has(overlay.id)) continue;
          const next = await mutatePatch(() => window.castApi.deleteOverlay(overlay.id));
          knownOverlays = next.overlays;
        }
        for (const overlay of stagedOverlays) {
          if (persistedById.has(overlay.id)) continue;
          const previousIds = new Set(knownOverlays.map((item) => item.id));
          const next = await mutatePatch(() => window.castApi.createOverlay(toOverlayCreateInput(overlay)));
          knownOverlays = next.overlays;
          const createdOverlay = knownOverlays.find((item) => !previousIds.has(item.id)) ?? null;
          if (createdOverlay && resolvedCurrentOverlayId === overlay.id) resolvedCurrentOverlayId = createdOverlay.id;
        }
        for (const overlay of stagedOverlays) {
          if (!persistedById.has(overlay.id)) continue;
          const persisted = persistedById.get(overlay.id);
          if (!persisted || overlaySignature(overlay) === overlaySignature(persisted)) continue;
          const next = await mutatePatch(() => window.castApi.updateOverlay({
            id: overlay.id,
            name: overlay.name,
            elements: cloneElements(overlay.elements),
            animation: overlay.animation,
          }));
          knownOverlays = next.overlays;
        }

      overlayStaged.setStagedItems(null);
      const nextOverlays = knownOverlays;
      const stillExists = resolvedCurrentOverlayId ? nextOverlays.some((o) => o.id === resolvedCurrentOverlayId) : false;
      if (!resolvedCurrentOverlayId || !stillExists) resolvedCurrentOverlayId = nextOverlays[0]?.id ?? null;
      overlayStaged.setCurrentItemId(resolvedCurrentOverlayId);
      setStatusText('Overlay changes pushed');
    } finally {
      overlayStaged.setIsPushingChanges(false);
    }
  }, [overlayStaged, mutatePatch, persistedOverlays, setStatusText]);

  useEffect(() => {
    overlayStaged.registerAutoPush(() => void pushOverlayChanges());
  }, [overlayStaged, pushOverlayChanges]);

  const overlayValue = useMemo<OverlayEditorValue>(() => ({
    overlays,
    currentOverlayId: overlayStaged.currentItemId,
    currentOverlay: overlayStaged.currentItem,
    hasPendingChanges: overlayStaged.hasPendingChanges,
    isPushingChanges: overlayStaged.isPushingChanges,
    nameFocusRequest: overlayNameFocusRequest,
    setCurrentOverlayId: overlayStaged.setCurrentItemId,
    updateOverlayDraft,
    createOverlay: createOverlayAction,
    duplicateOverlay: duplicateOverlayAction,
    deleteCurrentOverlay,
    requestNameFocus: requestOverlayNameFocus,
    pushChanges: pushOverlayChanges,
  }), [createOverlayAction, duplicateOverlayAction, overlayStaged.currentItem, overlayStaged.currentItemId, deleteCurrentOverlay, overlayStaged.hasPendingChanges, overlayStaged.isPushingChanges, overlayNameFocusRequest, overlays, pushOverlayChanges, overlayStaged.setCurrentItemId, requestOverlayNameFocus, updateOverlayDraft]);

  // ── Template editor ──

  const templateStaged = useStagedCollection<Template>({
    persistedItems: persistedTemplates,
    signatureOf: templateSignature,
    workbenchModeKey: 'template-editor',
    currentWorkbenchMode: workbenchMode,
  });

  const templates = templateStaged.items;
  const [templateNameFocusRequest, setTemplateNameFocusRequest] = useState(0);

  const requestTemplateNameFocus = useCallback((templateId: Id) => {
    templateStaged.setCurrentItemId(templateId);
    setTemplateNameFocusRequest((v) => v + 1);
  }, [templateStaged]);

  const updateTemplateDraft = useCallback((input: { id: Id; name?: string; kind?: TemplateKind; elements?: SlideElement[] }) => {
    templateStaged.setStagedItems((current) => {
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
  }, [persistedTemplates, templateStaged]);

  const replaceTemplateElements = useCallback((elements: SlideElement[]) => {
    if (!templateStaged.currentItemId) return;
    updateTemplateDraft({ id: templateStaged.currentItemId, elements });
  }, [templateStaged.currentItemId, updateTemplateDraft]);

  const createTemplate = useCallback((kind: TemplateKind) => {
    const now = new Date().toISOString();
    const id = createId();
    const draft: Template = {
      id,
      name: kind === 'lyrics' ? 'New Lyric Template' : kind === 'overlays' ? 'New Overlay Template' : 'New Slide Template',
      kind, width: 1920, height: 1080,
      order: (templates.at(-1)?.order ?? -1) + 1,
      elements: createDefaultTemplateElements(kind, id, now),
      createdAt: now, updatedAt: now,
    };
    templateStaged.setStagedItems((current) => [...(current ?? persistedTemplates), draft]);
    templateStaged.setCurrentItemId(draft.id);
    setStatusText('Created template');
  }, [persistedTemplates, setStatusText, templateStaged, templates]);

  const duplicateTemplate = useCallback((templateId: Id) => {
    const sourceTemplate = templates.find((t) => t.id === templateId) ?? null;
    if (!sourceTemplate) return;
    const now = new Date().toISOString();
    const duplicate: Template = {
      ...cloneTemplate(sourceTemplate),
      id: createId(),
      name: `${sourceTemplate.name} Copy`,
      order: (templates.at(-1)?.order ?? -1) + 1,
      createdAt: now, updatedAt: now,
    };
    templateStaged.setStagedItems((current) => [...(current ?? persistedTemplates), duplicate]);
    templateStaged.setCurrentItemId(duplicate.id);
    setStatusText('Duplicated template');
  }, [persistedTemplates, setStatusText, templateStaged, templates]);

  const renameTemplate = useCallback((templateId: Id, name: string) => {
    updateTemplateDraft({ id: templateId, name });
  }, [updateTemplateDraft]);

  const deleteTemplate = useCallback((templateId: Id) => {
    templateStaged.setStagedItems((current) => (current ?? persistedTemplates).filter((t) => t.id !== templateId));
    templateStaged.setCurrentItemId((current) => (current === templateId ? null : current));
    setStatusText('Deleted template');
  }, [persistedTemplates, setStatusText, templateStaged]);

  const openTemplateEditor = useCallback((templateId: Id) => {
    templateStaged.setCurrentItemId(templateId);
  }, [templateStaged]);

  const pushTemplateChanges = useCallback(async (): Promise<Id | null> => {
    if (!templateStaged.stagedItems || templateStaged.isPushingChanges) return templateStaged.currentItemId;
    const stagedTemplates = templateStaged.stagedItems;
    const stagedSig = stagedTemplates.map(templateSignature).join();
    const persistedSig = persistedTemplates.map(templateSignature).join();
    if (stagedSig === persistedSig) {
      templateStaged.setStagedItems(null);
      return templateStaged.currentItemId;
    }

    templateStaged.setIsPushingChanges(true);
    try {
      let resolvedCurrentTemplateId = templateStaged.currentItemId;
      let knownTemplates = persistedTemplates;
        const persistedById = new Map(persistedTemplates.map((t) => [t.id, t]));
        const stagedById = new Map(stagedTemplates.map((t) => [t.id, t]));

        for (const template of persistedTemplates) {
          if (stagedById.has(template.id)) continue;
          const next = await mutatePatch(() => window.castApi.deleteTemplate(template.id));
          knownTemplates = next.templates;
        }
        for (const template of stagedTemplates) {
          if (persistedById.has(template.id)) continue;
          const previousIds = new Set(knownTemplates.map((item) => item.id));
          const next = await mutatePatch(() => window.castApi.createTemplate({
            name: template.name, kind: template.kind, width: template.width, height: template.height,
            elements: cloneElements(template.elements),
          }));
          knownTemplates = next.templates;
          const createdTemplate = knownTemplates.find((item) => !previousIds.has(item.id)) ?? null;
          if (createdTemplate && resolvedCurrentTemplateId === template.id) resolvedCurrentTemplateId = createdTemplate.id;
        }
        for (const template of stagedTemplates) {
          if (!persistedById.has(template.id)) continue;
          const persisted = persistedById.get(template.id);
          if (!persisted || templateSignature(template) === templateSignature(persisted)) continue;
          const next = await mutatePatch(() => window.castApi.updateTemplate({
            id: template.id, name: template.name, kind: template.kind, width: template.width, height: template.height,
            elements: cloneElements(template.elements),
          }));
          knownTemplates = next.templates;
        }

      templateStaged.setStagedItems(null);
      const currentStillExists = resolvedCurrentTemplateId ? knownTemplates.some((t) => t.id === resolvedCurrentTemplateId) : false;
      if (!resolvedCurrentTemplateId || !currentStillExists) resolvedCurrentTemplateId = knownTemplates[0]?.id ?? null;
      templateStaged.setCurrentItemId(resolvedCurrentTemplateId);
      setStatusText('Template changes pushed');
      return resolvedCurrentTemplateId;
    } finally {
      templateStaged.setIsPushingChanges(false);
    }
  }, [templateStaged, mutatePatch, persistedTemplates, setStatusText]);

  const resolveTemplateIdForMutation = useCallback(async (templateId: Id): Promise<Id | null> => {
    if (templateStaged.currentItemId === templateId) return await pushTemplateChanges() ?? templateId;
    if (templateStaged.hasPendingChanges) await pushTemplateChanges();
    return templateId;
  }, [templateStaged.currentItemId, templateStaged.hasPendingChanges, pushTemplateChanges]);

  const applyTemplateToTarget = useCallback(async (templateId: Id, target: TemplateApplyTarget) => {
    const resolvedTemplateId = await resolveTemplateIdForMutation(templateId);
    if (!resolvedTemplateId) return;
    if (target.type === 'deck-item') {
      await mutatePatch(() => window.castApi.applyTemplateToDeckItem(resolvedTemplateId, target.itemId));
      setStatusText('Applied template to item');
      return;
    }
    await mutatePatch(() => window.castApi.applyTemplateToOverlay(resolvedTemplateId, target.overlayId));
    setStatusText('Applied template to overlay');
  }, [mutatePatch, resolveTemplateIdForMutation, setStatusText]);

  const detachTemplateFromDeckItem = useCallback(async (itemId: Id) => {
    await mutatePatch(() => window.castApi.detachTemplateFromDeckItem(itemId));
    setStatusText('Detached template from item');
  }, [mutatePatch, setStatusText]);

  const syncLinkedDeckItems = useCallback(async (templateId: Id) => {
    await mutatePatch(() => window.castApi.syncTemplateToLinkedDeckItems(templateId));
    setStatusText('Synced linked items to template');
  }, [mutatePatch, setStatusText]);

  useEffect(() => {
    templateStaged.registerAutoPush(() => void pushTemplateChanges());
  }, [templateStaged, pushTemplateChanges]);

  const templateValue = useMemo<TemplateEditorValue>(() => ({
    templates,
    currentTemplateId: templateStaged.currentItemId,
    currentTemplate: templateStaged.currentItem,
    hasPendingChanges: templateStaged.hasPendingChanges,
    isPushingChanges: templateStaged.isPushingChanges,
    nameFocusRequest: templateNameFocusRequest,
    setCurrentTemplateId: templateStaged.setCurrentItemId,
    openTemplateEditor,
    updateTemplateDraft,
    replaceTemplateElements,
    createTemplate,
    applyTemplateToTarget,
    detachTemplateFromDeckItem,
    syncLinkedDeckItems,
    deleteTemplate,
    duplicateTemplate,
    renameTemplate,
    requestNameFocus: requestTemplateNameFocus,
    pushChanges: pushTemplateChanges,
  }), [
    applyTemplateToTarget, createTemplate, templateStaged.currentItem, templateStaged.currentItemId,
    deleteTemplate, detachTemplateFromDeckItem, syncLinkedDeckItems, duplicateTemplate, templateStaged.hasPendingChanges, templateStaged.isPushingChanges,
    openTemplateEditor, pushTemplateChanges, renameTemplate, replaceTemplateElements, requestTemplateNameFocus,
    templateStaged.setCurrentItemId, templateNameFocusRequest, templates, updateTemplateDraft,
  ]);

  // ── Stage editor ──

  const stageStaged = useStagedCollection<Stage>({
    persistedItems: persistedStages,
    signatureOf: stageSignature,
    workbenchModeKey: 'stage-editor',
    currentWorkbenchMode: workbenchMode,
  });

  const stages = stageStaged.items;
  const [stageNameFocusRequest, setStageNameFocusRequest] = useState(0);

  const updateStageDraft = useCallback((input: { id: Id; name?: string; elements?: SlideElement[] }) => {
    stageStaged.setStagedItems((current) => {
      const source = current ?? persistedStages;
      return source.map((stage) => (
        stage.id === input.id
          ? {
            ...stage,
            name: input.name ?? stage.name,
            elements: input.elements ? cloneElements(input.elements) : stage.elements,
            updatedAt: new Date().toISOString(),
          }
          : stage
      ));
    });
  }, [persistedStages, stageStaged]);

  const replaceStageElements = useCallback((elements: SlideElement[]) => {
    if (!stageStaged.currentItemId) return;
    updateStageDraft({ id: stageStaged.currentItemId, elements });
  }, [stageStaged.currentItemId, updateStageDraft]);

  const createStageAction = useCallback(async () => {
    const now = new Date().toISOString();
    const draft: Stage = {
      id: createId(),
      name: 'New Stage',
      width: 1920,
      height: 1080,
      order: (stages.at(-1)?.order ?? -1) + 1,
      elements: [],
      createdAt: now,
      updatedAt: now,
    };
    stageStaged.setStagedItems((current) => [...(current ?? persistedStages), draft]);
    stageStaged.setCurrentItemId(draft.id);
    setStatusText('Created stage');
  }, [persistedStages, setStatusText, stageStaged, stages]);

  const duplicateStageAction = useCallback((stageId: Id) => {
    const source = stages.find((stage) => stage.id === stageId);
    if (!source) return;
    const now = new Date().toISOString();
    const duplicate: Stage = {
      ...cloneStage(source),
      id: createId(),
      name: `${source.name} Copy`,
      order: (stages.at(-1)?.order ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    stageStaged.setStagedItems((current) => [...(current ?? persistedStages), duplicate]);
    stageStaged.setCurrentItemId(duplicate.id);
    setStatusText('Duplicated stage');
  }, [persistedStages, setStatusText, stageStaged, stages]);

  const deleteCurrentStage = useCallback(async () => {
    if (!stageStaged.currentItemId) return;
    stageStaged.setStagedItems((current) => {
      const source = current ?? persistedStages;
      return source.filter((stage) => stage.id !== stageStaged.currentItemId);
    });
    setStatusText('Deleted stage');
  }, [persistedStages, setStatusText, stageStaged]);

  const requestStageNameFocus = useCallback((stageId: Id) => {
    stageStaged.setCurrentItemId(stageId);
    setStageNameFocusRequest((v) => v + 1);
  }, [stageStaged]);

  const pushStageChanges = useCallback(async () => {
    if (!stageStaged.stagedItems || stageStaged.isPushingChanges) return;
    const stagedStages = stageStaged.stagedItems;
    const stagedSig = stagedStages.map(stageSignature).join();
    const persistedSig = persistedStages.map(stageSignature).join();
    if (stagedSig === persistedSig) {
      stageStaged.setStagedItems(null);
      return;
    }

    stageStaged.setIsPushingChanges(true);
    try {
      let resolvedCurrentStageId = stageStaged.currentItemId;
      let knownStages = persistedStages;
      const persistedById = new Map(persistedStages.map((s) => [s.id, s]));
      const stagedById = new Map(stagedStages.map((s) => [s.id, s]));

      for (const stage of persistedStages) {
        if (stagedById.has(stage.id)) continue;
        const next = await mutatePatch(() => window.castApi.deleteStage(stage.id));
        knownStages = next.stages;
      }
      for (const stage of stagedStages) {
        if (persistedById.has(stage.id)) continue;
        const previousIds = new Set(knownStages.map((item) => item.id));
        const next = await mutatePatch(() => window.castApi.createStage({
          name: stage.name,
          width: stage.width,
          height: stage.height,
          elements: cloneElements(stage.elements),
        }));
        knownStages = next.stages;
        const createdStage = knownStages.find((item) => !previousIds.has(item.id)) ?? null;
        if (createdStage && resolvedCurrentStageId === stage.id) resolvedCurrentStageId = createdStage.id;
      }
      for (const stage of stagedStages) {
        if (!persistedById.has(stage.id)) continue;
        const persisted = persistedById.get(stage.id);
        if (!persisted || stageSignature(stage) === stageSignature(persisted)) continue;
        const next = await mutatePatch(() => window.castApi.updateStage({
          id: stage.id,
          name: stage.name,
          width: stage.width,
          height: stage.height,
          elements: cloneElements(stage.elements),
        }));
        knownStages = next.stages;
      }

      stageStaged.setStagedItems(null);
      const stillExists = resolvedCurrentStageId ? knownStages.some((s) => s.id === resolvedCurrentStageId) : false;
      if (!resolvedCurrentStageId || !stillExists) resolvedCurrentStageId = knownStages[0]?.id ?? null;
      stageStaged.setCurrentItemId(resolvedCurrentStageId);
      setStatusText('Stage changes pushed');
    } finally {
      stageStaged.setIsPushingChanges(false);
    }
  }, [stageStaged, mutatePatch, persistedStages, setStatusText]);

  useEffect(() => {
    stageStaged.registerAutoPush(() => void pushStageChanges());
  }, [stageStaged, pushStageChanges]);

  const stageValue = useMemo<StageEditorValue>(() => ({
    stages,
    currentStageId: stageStaged.currentItemId,
    currentStage: stageStaged.currentItem,
    hasPendingChanges: stageStaged.hasPendingChanges,
    isPushingChanges: stageStaged.isPushingChanges,
    nameFocusRequest: stageNameFocusRequest,
    setCurrentStageId: stageStaged.setCurrentItemId,
    updateStageDraft,
    replaceStageElements,
    createStage: createStageAction,
    duplicateStage: duplicateStageAction,
    deleteCurrentStage,
    requestNameFocus: requestStageNameFocus,
    pushChanges: pushStageChanges,
  }), [
    createStageAction, duplicateStageAction, stageStaged.currentItem, stageStaged.currentItemId,
    deleteCurrentStage, stageStaged.hasPendingChanges, stageStaged.isPushingChanges, stageNameFocusRequest,
    stages, pushStageChanges, replaceStageElements, stageStaged.setCurrentItemId, requestStageNameFocus, updateStageDraft,
  ]);

  // ── Deck editor ──

  const [stagedSlides, setStagedSlides] = useState<Record<Id, SlideElement[]>>({});
  const [isDeckPushingChanges, setIsDeckPushingChanges] = useState(false);
  const previousDeckModeRef = useRef(workbenchMode);

  const persistedElementsBySlideId = useMemo(() => {
    const map = new Map<Id, SlideElement[]>();
    for (const [slideId, elements] of slideElementsBySlideId.entries()) {
      map.set(slideId, elements);
    }
    return map;
  }, [slideElementsBySlideId]);

  const deckHasPendingChanges = useMemo(() => {
    for (const slideId of Object.keys(stagedSlides)) {
      const persisted = persistedElementsBySlideId.get(slideId) ?? [];
      const staged = stagedSlides[slideId] ?? [];
      if (slideElementsSignature(persisted) !== slideElementsSignature(staged)) return true;
    }
    return false;
  }, [persistedElementsBySlideId, stagedSlides]);

  const getSlideElements = useCallback((slideId: Id) => {
    return stagedSlides[slideId] ?? persistedElementsBySlideId.get(slideId) ?? [];
  }, [persistedElementsBySlideId, stagedSlides]);

  const replaceSlideElements = useCallback((slideId: Id, elements: SlideElement[]) => {
    setStagedSlides((current) => ({ ...current, [slideId]: cloneElements(elements) }));
  }, []);

  const pushDeckChanges = useCallback(async () => {
    if (isDeckPushingChanges) return;
    const pendingSlideIds = Object.keys(stagedSlides).filter((slideId) => {
      const persisted = persistedElementsBySlideId.get(slideId) ?? [];
      const staged = stagedSlides[slideId] ?? [];
      return slideElementsSignature(persisted) !== slideElementsSignature(staged);
    });
    if (pendingSlideIds.length === 0) { setStagedSlides({}); return; }

    setIsDeckPushingChanges(true);
    try {
      // Each mutatePatch call applies its patch before the next runs,
      // keeping the renderer snapshot in sync across the sequence.
      for (const slideId of pendingSlideIds) {
        const persisted = persistedElementsBySlideId.get(slideId) ?? [];
        const staged = stagedSlides[slideId] ?? [];
        const diff = buildSnapshotDiff(persisted, staged);
        if (diff.deletes.length > 0) {
          await mutatePatch(() => window.castApi.deleteElementsBatch(diff.deletes));
        }
        if (diff.updates.length > 0) {
          await mutatePatch(() =>
            diff.updates.length === 1
              ? window.castApi.updateElement(diff.updates[0])
              : window.castApi.updateElementsBatch(diff.updates),
          );
        }
        if (diff.creates.length > 0) {
          await mutatePatch(() =>
            diff.creates.length === 1
              ? window.castApi.createElement(diff.creates[0])
              : window.castApi.createElementsBatch(diff.creates),
          );
        }
      }
      setStagedSlides({});
      setStatusText('Slide changes pushed');
    } finally {
      setIsDeckPushingChanges(false);
    }
  }, [isDeckPushingChanges, mutatePatch, persistedElementsBySlideId, setStatusText, stagedSlides]);

  useEffect(() => {
    const previousMode = previousDeckModeRef.current;
    previousDeckModeRef.current = workbenchMode;
    if (previousMode !== 'deck-editor' || workbenchMode === 'deck-editor') return;
    if (!deckHasPendingChanges || isDeckPushingChanges) return;
    void pushDeckChanges();
  }, [deckHasPendingChanges, isDeckPushingChanges, pushDeckChanges, workbenchMode]);

  const deckValue = useMemo<DeckEditorValue>(() => ({
    hasPendingChanges: deckHasPendingChanges,
    isPushingChanges: isDeckPushingChanges,
    getSlideElements,
    replaceSlideElements,
    pushChanges: pushDeckChanges,
  }), [getSlideElements, deckHasPendingChanges, isDeckPushingChanges, pushDeckChanges, replaceSlideElements]);

  // ── Combined value ──

  return (
    <OverlayEditorContext.Provider value={overlayValue}>
      <TemplateEditorContext.Provider value={templateValue}>
        <DeckEditorContext.Provider value={deckValue}>
          <StageEditorContext.Provider value={stageValue}>
            {children}
          </StageEditorContext.Provider>
        </DeckEditorContext.Provider>
      </TemplateEditorContext.Provider>
    </OverlayEditorContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function useAssetEditor(): AssetEditorContextValue {
  const overlay = useOverlayEditor();
  const template = useTemplateEditor();
  const deck = useDeckEditor();
  const stage = useStageEditor();
  return { overlay, template, deck, stage };
}

export function useOverlayEditor(): OverlayEditorValue {
  const ctx = useContext(OverlayEditorContext);
  if (!ctx) throw new Error('useOverlayEditor must be used within AssetEditorProvider');
  return ctx;
}

export function useTemplateEditor(): TemplateEditorValue {
  const ctx = useContext(TemplateEditorContext);
  if (!ctx) throw new Error('useTemplateEditor must be used within AssetEditorProvider');
  return ctx;
}

export function useDeckEditor(): DeckEditorValue {
  const ctx = useContext(DeckEditorContext);
  if (!ctx) throw new Error('useDeckEditor must be used within AssetEditorProvider');
  return ctx;
}

export function useStageEditor(): StageEditorValue {
  const ctx = useContext(StageEditorContext);
  if (!ctx) throw new Error('useStageEditor must be used within AssetEditorProvider');
  return ctx;
}

// ─── Utils ──────────────────────────────────────────────────────────

function toOverlayCreateInput(overlay: Overlay): OverlayCreateInput {
  return { name: overlay.name, elements: cloneElements(overlay.elements), animation: overlay.animation };
}

function cloneOverlay(overlay: Overlay): Overlay {
  return JSON.parse(JSON.stringify(overlay)) as Overlay;
}

function overlaySignature(overlay: Overlay): string {
  return JSON.stringify({ id: overlay.id, name: overlay.name, animation: overlay.animation, elements: overlay.elements });
}

function templateSignature(template: Template): string {
  return JSON.stringify({ id: template.id, name: template.name, kind: template.kind, width: template.width, height: template.height, elements: template.elements });
}

function cloneTemplate(template: Template): Template {
  return JSON.parse(JSON.stringify(template)) as Template;
}

function stageSignature(stage: Stage): string {
  return JSON.stringify({ id: stage.id, name: stage.name, width: stage.width, height: stage.height, elements: stage.elements });
}

function cloneStage(stage: Stage): Stage {
  return JSON.parse(JSON.stringify(stage)) as Stage;
}
