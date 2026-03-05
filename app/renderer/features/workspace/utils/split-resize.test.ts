import { describe, expect, it } from 'vitest';
import { DEFAULT_WORKBENCH_LAYOUTS, WORKBENCH_SPLIT_DEFINITIONS } from '../types/workbench-panel-layout';
import { cloneSplitLayout, resizeSplitFromDelta, setPaneVisibility } from './split-resize';

describe('split-resize utilities', () => {
  it('shrinks adjacent pane first while resizing', () => {
    const definition = WORKBENCH_SPLIT_DEFINITIONS['show-main'];
    const baseLayout = cloneSplitLayout(DEFAULT_WORKBENCH_LAYOUTS.showMain);

    const result = resizeSplitFromDelta(definition, baseLayout, 1, -100);

    expect(result.layout.panes['show-left']?.size).toBe(300);
    expect(result.layout.panes['show-center']?.size).toBe(740);
    expect(result.layout.panes['show-right']?.size).toBe(420);
  });

  it('shrinks next pane after adjacent pane reaches minimum', () => {
    const definition = WORKBENCH_SPLIT_DEFINITIONS['show-main'];
    const baseLayout = cloneSplitLayout(DEFAULT_WORKBENCH_LAYOUTS.showMain);

    const result = resizeSplitFromDelta(definition, baseLayout, 0, 600);

    expect(result.layout.panes['show-left']?.size).toBe(900);
    expect(result.layout.panes['show-center']?.size).toBe(360);
    expect(result.layout.panes['show-right']?.size).toBe(200);
  });

  it('snaps a pane hidden and reopens it when drag reverses past the threshold', () => {
    const definition = WORKBENCH_SPLIT_DEFINITIONS['show-main'];
    const baseLayout = cloneSplitLayout(DEFAULT_WORKBENCH_LAYOUTS.showMain);

    const hidden = resizeSplitFromDelta(definition, baseLayout, 1, 260);
    const reopened = resizeSplitFromDelta(definition, baseLayout, 1, 240);

    expect(hidden.layout.panes['show-right']?.visible).toBe(false);
    expect(hidden.layout.panes['show-right']?.size).toBe(0);
    expect(hidden.layout.panes['show-right']?.lastVisibleSize).toBe(320);

    expect(reopened.layout.panes['show-right']?.visible).toBe(true);
    expect(reopened.layout.panes['show-right']?.size).toBe(140);
  });

  it('preserves last visible size when toggling pane visibility', () => {
    const definition = WORKBENCH_SPLIT_DEFINITIONS['show-main'];
    const baseLayout = cloneSplitLayout(DEFAULT_WORKBENCH_LAYOUTS.showMain);

    const hidden = setPaneVisibility(definition, baseLayout, 'show-right', false);
    const shown = setPaneVisibility(definition, hidden, 'show-right', true);

    expect(hidden.panes['show-right']?.visible).toBe(false);
    expect(hidden.panes['show-right']?.size).toBe(0);
    expect(hidden.panes['show-right']?.lastVisibleSize).toBe(320);

    expect(shown.panes['show-right']?.visible).toBe(true);
    expect(shown.panes['show-right']?.size).toBe(320);
  });

  it('does not hide non-collapsible center panes', () => {
    const definition = WORKBENCH_SPLIT_DEFINITIONS['show-main'];
    const baseLayout = cloneSplitLayout(DEFAULT_WORKBENCH_LAYOUTS.showMain);

    const next = setPaneVisibility(definition, baseLayout, 'show-center', false);

    expect(next.panes['show-center']?.visible).toBe(true);
    expect(next.panes['show-center']?.size).toBe(840);
  });
});
