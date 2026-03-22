import { describe, expect, it } from 'vitest';
import type { SplitDefinition } from '../types/workbench-panel-layout';
import { cloneSplitLayout, createDefaultSplitLayout, resizeSplitFromDelta, setPaneVisibility } from './split-resize';

const SHOW_MAIN_DEFINITION: SplitDefinition = {
  id: 'show-main',
  orientation: 'horizontal',
  fillPaneId: 'show-center',
  paneOrder: ['show-left', 'show-center', 'show-right'],
  panes: {
    'show-left': { id: 'show-left', defaultSize: 300, minSize: 140, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
    'show-center': { id: 'show-center', defaultSize: 840, minSize: 360, maxSize: Number.POSITIVE_INFINITY, collapsible: false, snap: false },
    'show-right': { id: 'show-right', defaultSize: 320, minSize: 140, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
  },
};

describe('split-resize utilities', () => {
  it('shrinks adjacent pane first while resizing', () => {
    const baseLayout = cloneSplitLayout(createDefaultSplitLayout(SHOW_MAIN_DEFINITION));

    const result = resizeSplitFromDelta(SHOW_MAIN_DEFINITION, baseLayout, 1, -100);

    expect(result.layout.panes['show-left']?.size).toBe(300);
    expect(result.layout.panes['show-center']?.size).toBe(740);
    expect(result.layout.panes['show-right']?.size).toBe(420);
  });

  it('shrinks next pane after adjacent pane reaches minimum', () => {
    const baseLayout = cloneSplitLayout(createDefaultSplitLayout(SHOW_MAIN_DEFINITION));

    const result = resizeSplitFromDelta(SHOW_MAIN_DEFINITION, baseLayout, 0, 600);

    expect(result.layout.panes['show-left']?.size).toBe(900);
    expect(result.layout.panes['show-center']?.size).toBe(360);
    expect(result.layout.panes['show-right']?.size).toBe(200);
  });

  it('snaps a pane hidden and reopens it when drag reverses past the threshold', () => {
    const baseLayout = cloneSplitLayout(createDefaultSplitLayout(SHOW_MAIN_DEFINITION));

    const hidden = resizeSplitFromDelta(SHOW_MAIN_DEFINITION, baseLayout, 1, 260);
    const reopened = resizeSplitFromDelta(SHOW_MAIN_DEFINITION, baseLayout, 1, 240);

    expect(hidden.layout.panes['show-right']?.visible).toBe(false);
    expect(hidden.layout.panes['show-right']?.size).toBe(0);
    expect(hidden.layout.panes['show-right']?.lastVisibleSize).toBe(320);

    expect(reopened.layout.panes['show-right']?.visible).toBe(true);
    expect(reopened.layout.panes['show-right']?.size).toBe(140);
  });

  it('preserves last visible size when toggling pane visibility', () => {
    const baseLayout = cloneSplitLayout(createDefaultSplitLayout(SHOW_MAIN_DEFINITION));

    const hidden = setPaneVisibility(SHOW_MAIN_DEFINITION, baseLayout, 'show-right', false);
    const shown = setPaneVisibility(SHOW_MAIN_DEFINITION, hidden, 'show-right', true);

    expect(hidden.panes['show-right']?.visible).toBe(false);
    expect(hidden.panes['show-right']?.size).toBe(0);
    expect(hidden.panes['show-right']?.lastVisibleSize).toBe(320);

    expect(shown.panes['show-right']?.visible).toBe(true);
    expect(shown.panes['show-right']?.size).toBe(320);
  });

  it('does not hide non-collapsible center panes', () => {
    const baseLayout = cloneSplitLayout(createDefaultSplitLayout(SHOW_MAIN_DEFINITION));

    const next = setPaneVisibility(SHOW_MAIN_DEFINITION, baseLayout, 'show-center', false);

    expect(next.panes['show-center']?.visible).toBe(true);
    expect(next.panes['show-center']?.size).toBe(840);
  });
});
