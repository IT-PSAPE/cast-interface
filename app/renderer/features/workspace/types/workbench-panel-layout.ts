export type WorkbenchSplitId = 'show-main' | 'show-center' | 'edit-main';

export type PaneId =
  | 'show-left'
  | 'show-center'
  | 'show-right'
  | 'show-middle'
  | 'show-bottom'
  | 'edit-left'
  | 'edit-center'
  | 'edit-right';

export type PanelToggleId = 'left' | 'right' | 'bottom';

export interface PaneLayoutState {
  size: number;
  visible: boolean;
  lastVisibleSize: number;
}

export interface SplitLayoutState {
  panes: Partial<Record<PaneId, PaneLayoutState>>;
}

export interface WorkbenchPanelLayouts {
  showMain: SplitLayoutState;
  showCenter: SplitLayoutState;
  editMain: SplitLayoutState;
}

export interface SplitPaneDefinition {
  id: PaneId;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
  snap: boolean;
}

export interface SplitDefinition {
  id: WorkbenchSplitId;
  orientation: 'horizontal' | 'vertical';
  paneOrder: PaneId[];
  fillPaneId: PaneId;
  panes: Partial<Record<PaneId, SplitPaneDefinition>>;
}

export interface DragSessionState {
  splitId: WorkbenchSplitId;
  handleIndex: number;
  startPointer: number;
  rawDelta: number;
  baseLayouts: WorkbenchPanelLayouts;
}

const DEFAULT_MAX_SIZE = Number.POSITIVE_INFINITY;

const SHOW_MAIN_DEFINITION: SplitDefinition = {
  id: 'show-main',
  orientation: 'horizontal',
  paneOrder: ['show-left', 'show-center', 'show-right'],
  fillPaneId: 'show-center',
  panes: {
    'show-left': { id: 'show-left', minSize: 140, maxSize: DEFAULT_MAX_SIZE, collapsible: true, snap: true },
    'show-center': { id: 'show-center', minSize: 360, maxSize: DEFAULT_MAX_SIZE, collapsible: false, snap: false },
    'show-right': { id: 'show-right', minSize: 140, maxSize: DEFAULT_MAX_SIZE, collapsible: true, snap: true },
  },
};

const SHOW_CENTER_DEFINITION: SplitDefinition = {
  id: 'show-center',
  orientation: 'vertical',
  paneOrder: ['show-middle', 'show-bottom'],
  fillPaneId: 'show-middle',
  panes: {
    'show-middle': { id: 'show-middle', minSize: 360, maxSize: DEFAULT_MAX_SIZE, collapsible: false, snap: false },
    'show-bottom': { id: 'show-bottom', minSize: 96, maxSize: DEFAULT_MAX_SIZE, collapsible: true, snap: true },
  },
};

const EDIT_MAIN_DEFINITION: SplitDefinition = {
  id: 'edit-main',
  orientation: 'horizontal',
  paneOrder: ['edit-left', 'edit-center', 'edit-right'],
  fillPaneId: 'edit-center',
  panes: {
    'edit-left': { id: 'edit-left', minSize: 140, maxSize: DEFAULT_MAX_SIZE, collapsible: true, snap: true },
    'edit-center': { id: 'edit-center', minSize: 360, maxSize: DEFAULT_MAX_SIZE, collapsible: false, snap: false },
    'edit-right': { id: 'edit-right', minSize: 140, maxSize: DEFAULT_MAX_SIZE, collapsible: true, snap: true },
  },
};

export const WORKBENCH_SPLIT_DEFINITIONS: Record<WorkbenchSplitId, SplitDefinition> = {
  'show-main': SHOW_MAIN_DEFINITION,
  'show-center': SHOW_CENTER_DEFINITION,
  'edit-main': EDIT_MAIN_DEFINITION,
};

export const DEFAULT_WORKBENCH_LAYOUTS: WorkbenchPanelLayouts = {
  showMain: {
    panes: {
      'show-left': { size: 300, visible: true, lastVisibleSize: 300 },
      'show-center': { size: 840, visible: true, lastVisibleSize: 840 },
      'show-right': { size: 320, visible: true, lastVisibleSize: 320 },
    },
  },
  showCenter: {
    panes: {
      'show-middle': { size: 600, visible: true, lastVisibleSize: 600 },
      'show-bottom': { size: 260, visible: true, lastVisibleSize: 260 },
    },
  },
  editMain: {
    panes: {
      'edit-left': { size: 280, visible: true, lastVisibleSize: 280 },
      'edit-center': { size: 840, visible: true, lastVisibleSize: 840 },
      'edit-right': { size: 320, visible: true, lastVisibleSize: 320 },
    },
  },
};
