import type { DeckItemType, Id, Overlay, Slide, SlideElement, Stage, Template, TemplateKind } from '@core/types';
import type { WorkbenchMode } from '../../types/ui';

export type EditorWorkbenchMode = 'deck-editor' | 'overlay-editor' | 'template-editor' | 'stage-editor';

export interface EditorSourceFrame {
  width: number;
  height: number;
}

export interface EditorCreateCapabilities {
  text: boolean;
  shape: boolean;
  media: boolean;
}

interface EditorSourceBase<TMode extends WorkbenchMode, TMeta> {
  mode: TMode;
  entityId: Id | null;
  hasSource: boolean;
  frame: EditorSourceFrame | Slide | null;
  elements: SlideElement[];
  replaceElements: (elements: SlideElement[]) => void;
  historyKey: string | null;
  emptyStateLabel: string;
  editable: boolean;
  createCapabilities: EditorCreateCapabilities;
  meta: TMeta;
}

export interface DeckEditorSource extends EditorSourceBase<'deck-editor', {
  slide: Slide | null;
  slideId: Id | null;
  deckItemType: DeckItemType | null;
}> {}

export interface OverlayEditorSource extends EditorSourceBase<'overlay-editor', {
  overlay: Overlay | null;
}> {}

export interface TemplateEditorSource extends EditorSourceBase<'template-editor', {
  template: Template | null;
  templateKind: TemplateKind | null;
}> {}

export interface StageEditorSource extends EditorSourceBase<'stage-editor', {
  stage: Stage | null;
}> {}

export interface InactiveEditorSource extends EditorSourceBase<Exclude<WorkbenchMode, EditorWorkbenchMode>, {}> {}

export type ActiveEditorSource =
  | DeckEditorSource
  | OverlayEditorSource
  | TemplateEditorSource
  | StageEditorSource
  | InactiveEditorSource;

export function isEditorWorkbenchMode(mode: WorkbenchMode): mode is EditorWorkbenchMode {
  return mode === 'deck-editor' || mode === 'overlay-editor' || mode === 'template-editor' || mode === 'stage-editor';
}
