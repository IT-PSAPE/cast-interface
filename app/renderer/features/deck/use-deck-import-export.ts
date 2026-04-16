import { useEffect, useMemo, useState } from 'react';
import type {
  DeckBundleBrokenReferenceAction,
  DeckBundleBrokenReferenceDecision,
  DeckBundleInspection,
  DeckItem,
  Id,
} from '@core/types';
import { useCast } from '../../contexts/app-context';
import { useProjectContent } from '../../contexts/use-project-content';

interface ImportDecisionState {
  action: DeckBundleBrokenReferenceAction;
  replacementPath: string | null;
}

interface ImportExportSettingsState {
  deckItems: DeckItem[];
  filterText: string;
  selectedIds: Set<Id>;
  selectedCount: number;
  exportInFlight: boolean;
  importInFlight: boolean;
  importPath: string | null;
  inspection: DeckBundleInspection | null;
  decisionMap: ReadonlyMap<string, ImportDecisionState>;
  blockedImportReasons: string[];
  message: string | null;
}

interface ImportExportSettingsActions {
  setFilterText: (value: string) => void;
  toggleSelectedId: (id: Id) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  exportSelected: () => Promise<void>;
  chooseImportBundle: () => Promise<void>;
  clearImportReview: () => void;
  setBrokenReferenceAction: (source: string, action: DeckBundleBrokenReferenceAction) => void;
  chooseReplacementPath: (source: string) => Promise<void>;
  finalizeImport: () => Promise<void>;
}

export function useDeckImportExport(): { state: ImportExportSettingsState; actions: ImportExportSettingsActions } {
  const { deckItems } = useProjectContent();
  const { mutate, setStatusText } = useCast();
  const [filterText, setFilterText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<Id>>(new Set());
  const [exportInFlight, setExportInFlight] = useState(false);
  const [importInFlight, setImportInFlight] = useState(false);
  const [importPath, setImportPath] = useState<string | null>(null);
  const [inspection, setInspection] = useState<DeckBundleInspection | null>(null);
  const [decisionMap, setDecisionMap] = useState<Map<string, ImportDecisionState>>(new Map());
  const [message, setMessage] = useState<string | null>(null);

  const normalizedFilterText = filterText.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return deckItems.filter((item) => {
      if (!normalizedFilterText) return true;
      return item.title.toLowerCase().includes(normalizedFilterText) || item.type.toLowerCase().includes(normalizedFilterText);
    });
  }, [deckItems, normalizedFilterText]);

  useEffect(() => {
    const contentIds = new Set(deckItems.map((item) => item.id));
    setSelectedIds((current) => {
      const next = new Set(Array.from(current).filter((id) => contentIds.has(id)));
      if (next.size === current.size) return current;
      return next;
    });
  }, [deckItems]);

  const blockedImportReasons = useMemo(() => {
    if (!inspection) return [];
    return inspection.brokenReferences.flatMap((reference) => {
      const decision = decisionMap.get(reference.source);
      if (!decision) return [`Choose an action for ${reference.source}`];
      if (decision.action === 'replace' && !decision.replacementPath) {
        return [`Choose a replacement file for ${reference.source}`];
      }
      return [];
    });
  }, [decisionMap, inspection]);

  function updateMessage(nextMessage: string | null) {
    setMessage(nextMessage);
    if (nextMessage) {
      setStatusText(nextMessage);
    }
  }

  function handleFilterTextChange(value: string) {
    setFilterText(value);
  }

  function handleToggleSelectedId(id: Id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAllVisible() {
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
  }

  function buildSuggestedBundleName(): string {
    const selectedItems = deckItems.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 1) return selectedItems[0].title;
    return selectedItems.length > 1 ? `cast-deck-${selectedItems.length}-items` : 'cast-deck';
  }

  async function handleExportSelected() {
    if (selectedIds.size === 0 || exportInFlight) return;
    setExportInFlight(true);
    updateMessage(null);
    try {
      const filePath = await window.castApi.chooseDeckBundleExportPath(buildSuggestedBundleName());
      if (!filePath) return;
      const result = await window.castApi.exportDeckBundle(Array.from(selectedIds), filePath);
      updateMessage(`Exported ${result.itemCount} item${result.itemCount === 1 ? '' : 's'}.`);
    } catch (error) {
      updateMessage((error as Error).message);
    } finally {
      setExportInFlight(false);
    }
  }

  async function inspectBundle(filePath: string) {
    const nextInspection = await window.castApi.inspectImportBundle(filePath);
    setImportPath(filePath);
    setInspection(nextInspection);
    setDecisionMap(new Map());
    updateMessage(`Loaded bundle with ${nextInspection.itemCount} item${nextInspection.itemCount === 1 ? '' : 's'}.`);
  }

  async function handleChooseImportBundle() {
    if (importInFlight) return;
    setImportInFlight(true);
    updateMessage(null);
    try {
      const filePath = await window.castApi.chooseDeckBundleImportPath();
      if (!filePath) return;
      await inspectBundle(filePath);
    } catch (error) {
      updateMessage((error as Error).message);
    } finally {
      setImportInFlight(false);
    }
  }

  function handleClearImportReview() {
    setImportPath(null);
    setInspection(null);
    setDecisionMap(new Map());
    updateMessage(null);
  }

  function handleSetBrokenReferenceAction(source: string, action: DeckBundleBrokenReferenceAction) {
    setDecisionMap((current) => {
      const next = new Map(current);
      const existing = next.get(source);
      next.set(source, {
        action,
        replacementPath: action === 'replace' ? existing?.replacementPath ?? null : null,
      });
      return next;
    });
  }

  async function handleChooseReplacementPath(source: string) {
    const filePath = await window.castApi.chooseImportReplacementMediaPath();
    if (!filePath) return;
    setDecisionMap((current) => {
      const next = new Map(current);
      next.set(source, { action: 'replace', replacementPath: filePath });
      return next;
    });
  }

  function buildFinalizeDecisions(): DeckBundleBrokenReferenceDecision[] {
    if (!inspection) return [];
    return inspection.brokenReferences.map((reference) => {
      const decision = decisionMap.get(reference.source);
      if (!decision) {
        throw new Error(`Missing decision for ${reference.source}`);
      }
      return {
        source: reference.source,
        action: decision.action,
        replacementPath: decision.replacementPath ?? undefined,
      };
    });
  }

  async function handleFinalizeImport() {
    if (!importPath || !inspection || blockedImportReasons.length > 0 || importInFlight) return;
    setImportInFlight(true);
    updateMessage(null);
    try {
      await mutate(() => window.castApi.finalizeImportBundle(importPath, buildFinalizeDecisions()));
      updateMessage(`Imported ${inspection.itemCount} item${inspection.itemCount === 1 ? '' : 's'}.`);
      setInspection(null);
      setImportPath(null);
      setDecisionMap(new Map());
    } catch (error) {
      updateMessage((error as Error).message);
    } finally {
      setImportInFlight(false);
    }
  }

  return {
    state: {
      deckItems: filteredItems,
      filterText,
      selectedIds,
      selectedCount: selectedIds.size,
      exportInFlight,
      importInFlight,
      importPath,
      inspection,
      decisionMap,
      blockedImportReasons,
      message,
    },
    actions: {
      setFilterText: handleFilterTextChange,
      toggleSelectedId: handleToggleSelectedId,
      selectAllVisible: handleSelectAllVisible,
      clearSelection: handleClearSelection,
      exportSelected: handleExportSelected,
      chooseImportBundle: handleChooseImportBundle,
      clearImportReview: handleClearImportReview,
      setBrokenReferenceAction: handleSetBrokenReferenceAction,
      chooseReplacementPath: handleChooseReplacementPath,
      finalizeImport: handleFinalizeImport,
    },
  };
}
