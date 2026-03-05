import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_WORKBENCH_LAYOUTS,
  WORKBENCH_SPLIT_DEFINITIONS,
  type DragSessionState,
  type PaneId,
  type PanelToggleId,
  type SplitLayoutState,
  type WorkbenchPanelLayouts,
  type WorkbenchSplitId,
} from '../types/workbench-panel-layout';
import {
  applyMeasuredPaneSizes,
  cloneSplitLayout,
  coerceSplitLayout,
  resizeSplitFromDelta,
  setPaneVisibility,
} from '../utils/split-resize';

const STORAGE_KEY = 'cast-interface.workbench-layout.v1';
const STORAGE_VERSION = 1;

type LayoutKey = keyof WorkbenchPanelLayouts;

interface PersistedWorkbenchLayouts {
  version: number;
  layouts: WorkbenchPanelLayouts;
}

interface ResizeStartInput {
  splitId: WorkbenchSplitId;
  handleIndex: number;
  pointerPosition: number;
  paneSizes: Record<string, number>;
}

interface ResizeMoveInput {
  splitId: WorkbenchSplitId;
  pointerPosition: number;
}

interface ResizeEndInput {
  splitId: WorkbenchSplitId;
}

interface WorkbenchPanelToggleState {
  show: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
  edit: {
    left: boolean;
    right: boolean;
  };
}

interface UseWorkbenchPanelLayoutResult {
  liveLayouts: WorkbenchPanelLayouts;
  committedLayouts: WorkbenchPanelLayouts;
  panelVisibility: WorkbenchPanelToggleState;
  startDrag: (input: ResizeStartInput) => void;
  updateDrag: (input: ResizeMoveInput) => void;
  endDrag: (input: ResizeEndInput) => void;
  togglePanel: (view: 'show' | 'edit', panel: PanelToggleId) => void;
}

const SPLIT_LAYOUT_KEYS: Record<WorkbenchSplitId, LayoutKey> = {
  'show-main': 'showMain',
  'show-center': 'showCenter',
  'edit-main': 'editMain',
};

const PANEL_TO_SPLIT_AND_PANE: Record<'show' | 'edit', Partial<Record<PanelToggleId, { splitId: WorkbenchSplitId; paneId: PaneId }>>> = {
  show: {
    left: { splitId: 'show-main', paneId: 'show-left' },
    right: { splitId: 'show-main', paneId: 'show-right' },
    bottom: { splitId: 'show-center', paneId: 'show-bottom' },
  },
  edit: {
    left: { splitId: 'edit-main', paneId: 'edit-left' },
    right: { splitId: 'edit-main', paneId: 'edit-right' },
  },
};

export function useWorkbenchPanelLayout(): UseWorkbenchPanelLayoutResult {
  const initialLayouts = useMemo(() => hydratePersistedLayouts(), []);

  const [committedLayouts, setCommittedLayouts] = useState<WorkbenchPanelLayouts>(initialLayouts);
  const [liveLayouts, setLiveLayouts] = useState<WorkbenchPanelLayouts>(initialLayouts);

  const committedLayoutsRef = useRef(committedLayouts);
  const liveLayoutsRef = useRef(liveLayouts);
  const dragSessionRef = useRef<DragSessionState | null>(null);

  const panelVisibility = useMemo<WorkbenchPanelToggleState>(() => {
    return {
      show: {
        left: requirePaneVisible(liveLayouts.showMain, 'show-left'),
        right: requirePaneVisible(liveLayouts.showMain, 'show-right'),
        bottom: requirePaneVisible(liveLayouts.showCenter, 'show-bottom'),
      },
      edit: {
        left: requirePaneVisible(liveLayouts.editMain, 'edit-left'),
        right: requirePaneVisible(liveLayouts.editMain, 'edit-right'),
      },
    };
  }, [liveLayouts]);

  const persistLayouts = useCallback((layouts: WorkbenchPanelLayouts) => {
    if (typeof window === 'undefined') return;

    const payload: PersistedWorkbenchLayouts = {
      version: STORAGE_VERSION,
      layouts,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const replaceBothLayouts = useCallback((layouts: WorkbenchPanelLayouts, persist: boolean) => {
    committedLayoutsRef.current = layouts;
    liveLayoutsRef.current = layouts;

    setCommittedLayouts(layouts);
    setLiveLayouts(layouts);

    if (persist) {
      persistLayouts(layouts);
    }
  }, [persistLayouts]);

  const startDrag = useCallback((input: ResizeStartInput) => {
    const definition = WORKBENCH_SPLIT_DEFINITIONS[input.splitId];
    const currentLiveLayouts = liveLayoutsRef.current;
    const baseSplit = getSplitLayout(currentLiveLayouts, input.splitId);

    const measuredSplit = applyMeasuredPaneSizes(
      definition,
      baseSplit,
      input.paneSizes as Partial<Record<PaneId, number>>,
    );

    const measuredLiveLayouts = setSplitLayout(currentLiveLayouts, input.splitId, measuredSplit);
    liveLayoutsRef.current = measuredLiveLayouts;
    setLiveLayouts(measuredLiveLayouts);

    dragSessionRef.current = {
      splitId: input.splitId,
      handleIndex: input.handleIndex,
      startPointer: input.pointerPosition,
      rawDelta: 0,
      baseLayouts: measuredLiveLayouts,
    };
  }, []);

  const updateDrag = useCallback((input: ResizeMoveInput) => {
    const session = dragSessionRef.current;
    if (!session) return;
    if (session.splitId !== input.splitId) return;

    const definition = WORKBENCH_SPLIT_DEFINITIONS[input.splitId];
    const rawDelta = input.pointerPosition - session.startPointer;
    const baseSplit = getSplitLayout(session.baseLayouts, input.splitId);
    const resized = resizeSplitFromDelta(definition, baseSplit, session.handleIndex, rawDelta);

    const nextLayouts = setSplitLayout(liveLayoutsRef.current, input.splitId, resized.layout);
    liveLayoutsRef.current = nextLayouts;
    setLiveLayouts(nextLayouts);

    session.rawDelta = rawDelta;
  }, []);

  const endDrag = useCallback((input: ResizeEndInput) => {
    const session = dragSessionRef.current;
    if (!session) return;
    if (session.splitId !== input.splitId) return;

    dragSessionRef.current = null;

    const committedNext = setSplitLayout(
      committedLayoutsRef.current,
      input.splitId,
      getSplitLayout(liveLayoutsRef.current, input.splitId),
    );

    replaceBothLayouts(committedNext, true);
  }, [replaceBothLayouts]);

  const togglePanel = useCallback((view: 'show' | 'edit', panel: PanelToggleId) => {
    const mapping = PANEL_TO_SPLIT_AND_PANE[view][panel];
    if (!mapping) return;

    dragSessionRef.current = null;

    const definition = WORKBENCH_SPLIT_DEFINITIONS[mapping.splitId];
    const baseSplit = getSplitLayout(committedLayoutsRef.current, mapping.splitId);
    const isVisible = requirePaneVisible(baseSplit, mapping.paneId);
    const nextSplit = setPaneVisibility(definition, baseSplit, mapping.paneId, !isVisible);

    const nextLayouts = setSplitLayout(committedLayoutsRef.current, mapping.splitId, nextSplit);
    replaceBothLayouts(nextLayouts, true);
  }, [replaceBothLayouts]);

  return {
    liveLayouts,
    committedLayouts,
    panelVisibility,
    startDrag,
    updateDrag,
    endDrag,
    togglePanel,
  };
}

function hydratePersistedLayouts(): WorkbenchPanelLayouts {
  const defaults = cloneWorkbenchLayouts(DEFAULT_WORKBENCH_LAYOUTS);

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as PersistedWorkbenchLayouts;
    if (parsed.version !== STORAGE_VERSION) return defaults;
    if (!parsed.layouts) return defaults;

    return {
      showMain: coerceSplitLayout(WORKBENCH_SPLIT_DEFINITIONS['show-main'], parsed.layouts.showMain, defaults.showMain),
      showCenter: coerceSplitLayout(WORKBENCH_SPLIT_DEFINITIONS['show-center'], parsed.layouts.showCenter, defaults.showCenter),
      editMain: coerceSplitLayout(WORKBENCH_SPLIT_DEFINITIONS['edit-main'], parsed.layouts.editMain, defaults.editMain),
    };
  } catch {
    return defaults;
  }
}

function cloneWorkbenchLayouts(layouts: WorkbenchPanelLayouts): WorkbenchPanelLayouts {
  return {
    showMain: cloneSplitLayout(layouts.showMain),
    showCenter: cloneSplitLayout(layouts.showCenter),
    editMain: cloneSplitLayout(layouts.editMain),
  };
}

function getSplitLayout(layouts: WorkbenchPanelLayouts, splitId: WorkbenchSplitId): SplitLayoutState {
  const key = SPLIT_LAYOUT_KEYS[splitId];
  return layouts[key];
}

function setSplitLayout(layouts: WorkbenchPanelLayouts, splitId: WorkbenchSplitId, splitLayout: SplitLayoutState): WorkbenchPanelLayouts {
  const key = SPLIT_LAYOUT_KEYS[splitId];
  return {
    ...layouts,
    [key]: splitLayout,
  };
}

function requirePaneVisible(layout: SplitLayoutState, paneId: PaneId): boolean {
  const pane = layout.panes[paneId];
  if (!pane) {
    throw new Error(`Missing pane visibility for: ${paneId}`);
  }
  return pane.visible;
}

export type {
  ResizeStartInput,
  ResizeMoveInput,
  ResizeEndInput,
  UseWorkbenchPanelLayoutResult,
  WorkbenchPanelToggleState,
};
