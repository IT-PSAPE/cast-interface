import { describe, expect, it } from 'vitest';
import { getEditorHeaderActions } from './editor-header-actions';

describe('getEditorHeaderActions', () => {
  it('limits overlay editor actions to overlay creation', () => {
    expect(getEditorHeaderActions('overlay-editor')).toEqual([
      { kind: 'create-overlay', label: 'New overlay' },
    ]);
  });

  it('limits stage editor actions to stage creation', () => {
    expect(getEditorHeaderActions('stage-editor')).toEqual([
      { kind: 'create-stage', label: 'New stage' },
    ]);
  });

  it('keeps template editor actions template-specific', () => {
    expect(getEditorHeaderActions('template-editor')).toEqual([
      { kind: 'create-template', label: 'New presentation template', templateKind: 'slides' },
      { kind: 'create-template', label: 'New lyric template', templateKind: 'lyrics' },
    ]);
  });
});
