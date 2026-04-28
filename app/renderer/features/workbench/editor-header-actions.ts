import type { TemplateKind } from '@core/types';
import type { EditorWorkbenchMode } from '../../contexts/canvas/editor-source';

export type EditorHeaderAction =
  | { kind: 'create-overlay'; label: 'New overlay' }
  | { kind: 'create-stage'; label: 'New stage' }
  | { kind: 'create-template'; label: string; templateKind: Extract<TemplateKind, 'slides' | 'lyrics'> };

export function getEditorHeaderActions(mode: Extract<EditorWorkbenchMode, 'overlay-editor' | 'template-editor' | 'stage-editor'>): EditorHeaderAction[] {
  if (mode === 'overlay-editor') {
    return [{ kind: 'create-overlay', label: 'New overlay' }];
  }

  if (mode === 'stage-editor') {
    return [{ kind: 'create-stage', label: 'New stage' }];
  }

  return [
    { kind: 'create-template', label: 'New presentation template', templateKind: 'slides' },
    { kind: 'create-template', label: 'New lyric template', templateKind: 'lyrics' },
  ];
}
