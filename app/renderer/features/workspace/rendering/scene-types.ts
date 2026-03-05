import type { Id, Slide, SlideElement } from '@core/types';
import type { VisualPayloadState } from '@core/element-payload';

export type SceneSurface = 'edit' | 'show' | 'outline';
export type SceneSourcePolicy = 'draft' | 'persisted' | 'live';

export interface RenderNode {
  id: Id;
  element: SlideElement;
  visual: VisualPayloadState;
  isVideo: boolean;
}

export interface RenderScene {
  slide: Slide;
  width: number;
  height: number;
  nodes: RenderNode[];
}

export interface GuideLine {
  points: [number, number, number, number];
  orientation: 'horizontal' | 'vertical';
}

export interface SelectionState {
  selectedIds: Id[];
  primarySelectedId: Id | null;
}
