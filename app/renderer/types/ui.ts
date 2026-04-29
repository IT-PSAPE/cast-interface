import type { Id, SlideElement } from '@core/types';

export type ThemeMode = 'light' | 'dark' | 'system';
export type SlideBrowserMode = 'grid' | 'list';
export type ResourceDrawerViewMode = 'grid' | 'list';
export type PlaylistBrowserMode = 'current' | 'tabs' | 'continuous';
export type WorkbenchMode = 'show' | 'deck-editor' | 'overlay-editor' | 'template-editor' | 'stage-editor' | 'settings';
export type InteractionMode = 'move' | 'resize';
export type DrawerTab = 'deck' | 'media' | 'templates';
export type DrawerViewModeMap = Record<DrawerTab, ResourceDrawerViewMode>;
export type InspectorTab = 'presentation' | 'slide' | 'shape' | 'text' | 'template' | 'stage' | 'binding';
export type LibraryPanelView = 'libraries' | 'playlist';
export type PreviewSurfaceKind = 'preview' | 'monitor' | 'stage';
export type PreviewMode = 'single' | 'all';
export type PreviewGridDensity = 1 | 2;
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
