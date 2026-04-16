import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDefaultTemplateElements } from '@core/templates';
import type { AppSnapshot, Id, Overlay, OverlayCreateInput, OverlayUpdateInput, SlideElement, Template, TemplateKind } from '@core/types';
import { cloneElements, slideElementsSignature } from '../../utils/staged-editor-utils';
import { getOverlayDefaults } from '../../utils/slides';
import { createId } from '../../utils/create-id';
import { useStagedCollection } from '../../hooks/use-staged-collection';
import { buildSnapshotDiff } from '../element/element-history-utils';
import { useCast } from '../app-context';
import { useSlides } from '../slide-context';
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
  setCurrentOverlayId: (overlayId: Id | null) => void;
  updateOverlayDraft: (input: OverlayUpdateInput) => void;
  createOverlay: () => Promise<void>;
  deleteCurrentOverlay: () => Promise<void>;
  pushChanges: () => Promise<void>;
}

interface TemplateEditorValue {
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

interface DeckEditorValue {
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  getSlideElements: (slideId: Id) => SlideElement[];
  replaceSlideElements: (slideId: Id, elements: SlideElement[]) => void;
  pushChanges: () => Promise<void>;
}

interface AssetEditorContextValue {
  overlay: OverlayEditorValue;
  template: TemplateEditorValue;
  deck: DeckEditorValue;
}

// ─── Context ────────────────────────────────────────────────────────

const AssetEditorContext = createContext<AssetEditorContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────

export function AssetEditorProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { state: { workbenchMode, overlayDefaults } } = useWorkbench();
  const { currentSlide } = useSlides();
  const {
    overlays: persistedOverlays,
    templates: persistedTemplates,
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
      const next = await mutate(async () => {
        let snapshot: AppSnapshot | null = null;
        let knownOverlays = persistedOverlays;
        const persistedById = new Map(persistedOverlays.map((o) => [o.id, o]));
        const stagedById = new Map(stagedOverlays.map((o) => [o.id, o]));

        for (const overlay of persistedOverlays) {
          if (stagedById.has(overlay.id)) continue;
          snapshot = await window.castApi.deleteOverlay(overlay.id);
          knownOverlays = snapshot.overlays;
        }
        for (const overlay of stagedOverlays) {
          if (persistedById.has(overlay.id)) continue;
          const previousIds = new Set(knownOverlays.map((item) => item.id));
          snapshot = await window.castApi.createOverlay(toOverlayCreateInput(overlay));
          knownOverlays = snapshot.overlays;
          const createdOverlay = knownOverlays.find((item) => !previousIds.has(item.id)) ?? null;
          if (createdOverlay && resolvedCurrentOverlayId === overlay.id) resolvedCurrentOverlayId = createdOverlay.id;
        }
        for (const overlay of stagedOverlays) {
          if (!persistedById.has(overlay.id)) continue;
          const persisted = persistedById.get(overlay.id);
          if (!persisted || overlaySignature(overlay) === overlaySignature(persisted)) continue;
          snapshot = await window.castApi.updateOverlay({ id: overlay.id, name: overlay.name, elements: cloneElements(overlay.elements), animation: overlay.animation });
          knownOverlays = snapshot.overlays;
        }

        if (snapshot) return snapshot;
        return window.castApi.getSnapshot();
      });

      overlayStaged.setStagedItems(null);
      const nextOverlays = next.overlays;
      const stillExists = resolvedCurrentOverlayId ? nextOverlays.some((o) => o.id === resolvedCurrentOverlayId) : false;
      if (!resolvedCurrentOverlayId || !stillExists) resolvedCurrentOverlayId = nextOverlays[0]?.id ?? null;
      overlayStaged.setCurrentItemId(resolvedCurrentOverlayId);
      setStatusText('Overlay changes pushed');
    } finally {
      overlayStaged.setIsPushingChanges(false);
    }
  }, [overlayStaged, mutate, persistedOverlays, setStatusText]);

  useEffect(() => {
    overlayStaged.registerAutoPush(() => void pushOverlayChanges());
  }, [overlayStaged, pushOverlayChanges]);

  const overlayValue = useMemo<OverlayEditorValue>(() => ({
    overlays,
    currentOverlayId: overlayStaged.currentItemId,
    currentOverlay: overlayStaged.currentItem,
    hasPendingChanges: overlayStaged.hasPendingChanges,
    isPushingChanges: overlayStaged.isPushingChanges,
    setCurrentOverlayId: overlayStaged.setCurrentItemId,
    updateOverlayDraft,
    createOverlay: createOverlayAction,
    deleteCurrentOverlay,
    pushChanges: pushOverlayChanges,
  }), [createOverlayAction, overlayStaged.currentItem, overlayStaged.currentItemId, deleteCurrentOverlay, overlayStaged.hasPendingChanges, overlayStaged.isPushingChanges, overlays, pushOverlayChanges, overlayStaged.setCurrentItemId, updateOverlayDraft]);

  // ── Template editor ──

  const templateStaged = useStagedCollection<Template>({
    persistedItems: persistedTemplates,
    signatureOf: templateSignature,
    workbenchModeKey: 'template-editor',
    currentWorkbenchMode: workbenchMode,
  });

  const templates = templateStaged.items;

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
      const next = await mutate(async () => {
        let snapshot: AppSnapshot | null = null;
        let knownTemplates = persistedTemplates;
        const persistedById = new Map(persistedTemplates.map((t) => [t.id, t]));
        const stagedById = new Map(stagedTemplates.map((t) => [t.id, t]));

        for (const template of persistedTemplates) {
          if (stagedById.has(template.id)) continue;
          snapshot = await window.castApi.deleteTemplate(template.id);
          knownTemplates = snapshot.templates;
        }
        for (const template of stagedTemplates) {
          if (persistedById.has(template.id)) continue;
          const previousIds = new Set(knownTemplates.map((item) => item.id));
          snapshot = await window.castApi.createTemplate({
            name: template.name, kind: template.kind, width: template.width, height: template.height,
            elements: cloneElements(template.elements),
          });
          knownTemplates = snapshot.templates;
          const createdTemplate = knownTemplates.find((item) => !previousIds.has(item.id)) ?? null;
          if (createdTemplate && resolvedCurrentTemplateId === template.id) resolvedCurrentTemplateId = createdTemplate.id;
        }
        for (const template of stagedTemplates) {
          if (!persistedById.has(template.id)) continue;
          const persisted = persistedById.get(template.id);
          if (!persisted || templateSignature(template) === templateSignature(persisted)) continue;
          snapshot = await window.castApi.updateTemplate({
            id: template.id, name: template.name, kind: template.kind, width: template.width, height: template.height,
            elements: cloneElements(template.elements),
          });
          knownTemplates = snapshot.templates;
        }

        if (snapshot) return snapshot;
        return window.castApi.getSnapshot();
      });

      templateStaged.setStagedItems(null);
      const currentStillExists = resolvedCurrentTemplateId ? next.templates.some((t) => t.id === resolvedCurrentTemplateId) : false;
      if (!resolvedCurrentTemplateId || !currentStillExists) resolvedCurrentTemplateId = next.templates[0]?.id ?? null;
      templateStaged.setCurrentItemId(resolvedCurrentTemplateId);
      setStatusText('Template changes pushed');
      return resolvedCurrentTemplateId;
    } finally {
      templateStaged.setIsPushingChanges(false);
    }
  }, [templateStaged, mutate, persistedTemplates, setStatusText]);

  const resolveTemplateIdForMutation = useCallback(async (templateId: Id): Promise<Id | null> => {
    if (templateStaged.currentItemId === templateId) return await pushTemplateChanges() ?? templateId;
    if (templateStaged.hasPendingChanges) await pushTemplateChanges();
    return templateId;
  }, [templateStaged.currentItemId, templateStaged.hasPendingChanges, pushTemplateChanges]);

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

  useEffect(() => {
    templateStaged.registerAutoPush(() => void pushTemplateChanges());
  }, [templateStaged, pushTemplateChanges]);

  const templateValue = useMemo<TemplateEditorValue>(() => ({
    templates,
    currentTemplateId: templateStaged.currentItemId,
    currentTemplate: templateStaged.currentItem,
    hasPendingChanges: templateStaged.hasPendingChanges,
    isPushingChanges: templateStaged.isPushingChanges,
    setCurrentTemplateId: templateStaged.setCurrentItemId,
    openTemplateEditor,
    updateTemplateDraft,
    replaceTemplateElements,
    createTemplate,
    applyTemplateToTarget,
    deleteTemplate,
    duplicateTemplate,
    renameTemplate,
    pushChanges: pushTemplateChanges,
  }), [
    applyTemplateToTarget, createTemplate, templateStaged.currentItem, templateStaged.currentItemId,
    deleteTemplate, duplicateTemplate, templateStaged.hasPendingChanges, templateStaged.isPushingChanges,
    openTemplateEditor, pushTemplateChanges, renameTemplate, replaceTemplateElements,
    templateStaged.setCurrentItemId, templates, updateTemplateDraft,
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
      await mutate(async () => {
        let snapshot: AppSnapshot | null = null;
        for (const slideId of pendingSlideIds) {
          const persisted = persistedElementsBySlideId.get(slideId) ?? [];
          const staged = stagedSlides[slideId] ?? [];
          const diff = buildSnapshotDiff(persisted, staged);
          if (diff.deletes.length > 0) snapshot = await window.castApi.deleteElementsBatch(diff.deletes);
          if (diff.updates.length > 0) {
            snapshot = diff.updates.length === 1
              ? await window.castApi.updateElement(diff.updates[0])
              : await window.castApi.updateElementsBatch(diff.updates);
          }
          if (diff.creates.length > 0) {
            snapshot = diff.creates.length === 1
              ? await window.castApi.createElement(diff.creates[0])
              : await window.castApi.createElementsBatch(diff.creates);
          }
        }
        if (snapshot) return snapshot;
        return window.castApi.getSnapshot();
      });
      setStagedSlides({});
      setStatusText('Slide changes pushed');
    } finally {
      setIsDeckPushingChanges(false);
    }
  }, [isDeckPushingChanges, mutate, persistedElementsBySlideId, setStatusText, stagedSlides]);

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

  const value = useMemo<AssetEditorContextValue>(
    () => ({ overlay: overlayValue, template: templateValue, deck: deckValue }),
    [overlayValue, templateValue, deckValue],
  );

  return <AssetEditorContext.Provider value={value}>{children}</AssetEditorContext.Provider>;
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function useAssetEditor(): AssetEditorContextValue {
  const ctx = useContext(AssetEditorContext);
  if (!ctx) throw new Error('useAssetEditor must be used within AssetEditorProvider');
  return ctx;
}

export function useOverlayEditor(): OverlayEditorValue {
  return useAssetEditor().overlay;
}

export function useTemplateEditor(): TemplateEditorValue {
  return useAssetEditor().template;
}

export function useDeckEditor(): DeckEditorValue {
  return useAssetEditor().deck;
}

// ─── Utils ──────────────────────────────────────────────────────────

function toOverlayCreateInput(overlay: Overlay): OverlayCreateInput {
  return { name: overlay.name, elements: cloneElements(overlay.elements), animation: overlay.animation };
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
