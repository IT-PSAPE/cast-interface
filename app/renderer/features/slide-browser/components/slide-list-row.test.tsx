import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RenderScene } from '../../stage/rendering/scene-types';
import { SlideOutlineRow } from './slide-list-row';
import type { OutlineSlideRow } from '../hooks/use-slide-list-view';

vi.mock('../../../components/scene-frame', () => ({
  SceneFrame: function SceneFrame({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  },
}));

vi.mock('../../stage/rendering/scene-stage', () => ({
  SceneStage: function SceneStage() {
    return <div>Scene</div>;
  },
}));

const SCENE: RenderScene = {
  slide: { id: 'slide-1', presentationId: 'presentation-1', width: 1920, height: 1080, notes: '', order: 0, createdAt: '', updatedAt: '' },
  width: 1920,
  height: 1080,
  nodes: [],
};

function createRow(input: Partial<OutlineSlideRow> = {}): OutlineSlideRow {
  return {
    slide: { id: 'slide-1', presentationId: 'presentation-1', width: 1920, height: 1080, notes: '', order: 0, createdAt: '', updatedAt: '' },
    index: 0,
    state: 'selected',
    elements: [],
    text: 'Verse 1\nVerse 2',
    primaryText: 'Verse 1',
    secondaryText: 'Verse 2',
    textElementId: 'text-1',
    textEditable: false,
    ...input,
  };
}

describe('SlideOutlineRow', () => {
  it('opens focus mode on double click for non-lyric rows', () => {
    const handleOpen = vi.fn();

    render(
      <SlideOutlineRow
        row={createRow()}
        scene={SCENE}
        isFocused
        onSelect={vi.fn()}
        onOpen={handleOpen}
        onTextCommit={vi.fn()}
      />
    );

    fireEvent.doubleClick(screen.getByRole('button'));

    expect(handleOpen).toHaveBeenCalledWith(0);
  });

  it('edits full lyric text inline without opening focus mode', () => {
    const handleOpen = vi.fn();
    const handleCommit = vi.fn();

    render(
      <SlideOutlineRow
        row={createRow({ textEditable: true })}
        scene={SCENE}
        isFocused
        onSelect={vi.fn()}
        onOpen={handleOpen}
        onTextCommit={handleCommit}
      />
    );

    fireEvent.doubleClick(screen.getByRole('button'));
    expect(handleOpen).not.toHaveBeenCalled();

    fireEvent.doubleClick(screen.getByText(/Verse 1/));

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Verse 1\nUpdated Verse 2' } });
    fireEvent.blur(textarea);

    expect(handleCommit).toHaveBeenCalledWith('slide-1', 'Verse 1\nUpdated Verse 2');
    expect(handleOpen).not.toHaveBeenCalled();
  });
});
