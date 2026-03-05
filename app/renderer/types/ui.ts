import type { Id, SlideElement } from '@core/types';

export type CanvasViewMode = 'single' | 'grid' | 'outline';
export type WorkspaceView = 'show' | 'edit';
export type InteractionMode = 'move' | 'resize';
export type DrawerTab = 'media' | 'overlays' | 'shortcuts';
export type InspectorTab = 'presentation' | 'slide' | 'shape' | 'text';
export type SidebarStage = 'libraries' | 'playlists';
export type SlideVisualState = 'live' | 'queued' | 'selected' | 'warning';
export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface InteractionState {
  elementId: Id;
  mode: InteractionMode;
  handle: ResizeHandle | null;
  lockAspectRatio: boolean;
  aspectRatio: number;
  pointerStart: { x: number; y: number };
  elementStart: { x: number; y: number; width: number; height: number };
}

export interface ShortcutItem {
  keys: string;
  action: string;
}

export interface ElementInspectorDraft {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export const LAYER_ORDER: Record<SlideElement['layer'], number> = {
  background: 0,
  media: 1,
  content: 2,
};
