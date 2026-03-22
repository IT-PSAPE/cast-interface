import { act } from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkbenchPanelLayout, type UseWorkbenchPanelLayoutResult } from './use-workbench-panel-layout';
import type { SplitDefinition } from '../types/workbench-panel-layout';

const STORAGE_KEY = 'cast-interface.workbench-layout.v1';

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

const SHOW_CENTER_DEFINITION: SplitDefinition = {
  id: 'show-center',
  orientation: 'vertical',
  fillPaneId: 'show-middle',
  paneOrder: ['show-middle', 'show-bottom'],
  panes: {
    'show-middle': { id: 'show-middle', defaultSize: 600, minSize: 360, maxSize: Number.POSITIVE_INFINITY, collapsible: false, snap: false },
    'show-bottom': { id: 'show-bottom', defaultSize: 260, minSize: 96, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
  },
};

const EDIT_MAIN_DEFINITION: SplitDefinition = {
  id: 'edit-main',
  orientation: 'horizontal',
  fillPaneId: 'edit-center',
  paneOrder: ['edit-left', 'edit-center', 'edit-right'],
  panes: {
    'edit-left': { id: 'edit-left', defaultSize: 280, minSize: 140, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
    'edit-center': { id: 'edit-center', defaultSize: 840, minSize: 360, maxSize: Number.POSITIVE_INFINITY, collapsible: false, snap: false },
    'edit-right': { id: 'edit-right', defaultSize: 320, minSize: 140, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
  },
};

const EDIT_CENTER_DEFINITION: SplitDefinition = {
  id: 'edit-center',
  orientation: 'vertical',
  fillPaneId: 'edit-middle',
  paneOrder: ['edit-middle', 'edit-bottom'],
  panes: {
    'edit-middle': { id: 'edit-middle', defaultSize: 620, minSize: 240, maxSize: Number.POSITIVE_INFINITY, collapsible: false, snap: false },
    'edit-bottom': { id: 'edit-bottom', defaultSize: 220, minSize: 120, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
  },
};

const OVERLAY_MAIN_DEFINITION: SplitDefinition = {
  id: 'overlay-main',
  orientation: 'horizontal',
  fillPaneId: 'overlay-center',
  paneOrder: ['overlay-left', 'overlay-center', 'overlay-right'],
  panes: {
    'overlay-left': { id: 'overlay-left', defaultSize: 280, minSize: 140, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
    'overlay-center': { id: 'overlay-center', defaultSize: 840, minSize: 360, maxSize: Number.POSITIVE_INFINITY, collapsible: false, snap: false },
    'overlay-right': { id: 'overlay-right', defaultSize: 320, minSize: 140, maxSize: Number.POSITIVE_INFINITY, collapsible: true, snap: true },
  },
};

interface HookProbe {
  current: UseWorkbenchPanelLayoutResult | null;
}

interface HookHarnessProps {
  probe: HookProbe;
}

function HookHarness({ probe }: HookHarnessProps) {
  probe.current = useWorkbenchPanelLayout();
  return null;
}

describe('useWorkbenchPanelLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps drag updates in memory and persists only on drag end', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const probe: HookProbe = { current: null };

    render(<HookHarness probe={probe} />);

    act(() => {
      probe.current?.registerSplit(SHOW_MAIN_DEFINITION);
      probe.current?.startDrag({
        definition: SHOW_MAIN_DEFINITION,
        handleIndex: 1,
        pointerPosition: 0,
        paneSizes: {
          'show-left': 300,
          'show-center': 840,
          'show-right': 320,
        },
      });
    });

    act(() => {
      probe.current?.updateDrag({ definition: SHOW_MAIN_DEFINITION, pointerPosition: 180 });
    });

    expect(setItemSpy).toHaveBeenCalledTimes(0);

    act(() => {
      probe.current?.endDrag({ splitId: 'show-main' });
    });

    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('persists toggle actions immediately', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const probe: HookProbe = { current: null };

    render(<HookHarness probe={probe} />);

    act(() => {
      probe.current?.registerSplit(SHOW_MAIN_DEFINITION);
      probe.current?.togglePanel('show-main', 'show-right');
    });

    expect(probe.current?.isPanelVisible('show-main', 'show-right')).toBe(false);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('restores persisted layout per split', () => {
    const firstProbe: HookProbe = { current: null };
    const firstRender = render(<HookHarness probe={firstProbe} />);

    act(() => {
      firstProbe.current?.registerSplit(SHOW_MAIN_DEFINITION);
      firstProbe.current?.registerSplit(EDIT_MAIN_DEFINITION);
      firstProbe.current?.registerSplit(EDIT_CENTER_DEFINITION);
      firstProbe.current?.registerSplit(OVERLAY_MAIN_DEFINITION);
      firstProbe.current?.togglePanel('show-main', 'show-right');
      firstProbe.current?.togglePanel('edit-main', 'edit-left');
      firstProbe.current?.togglePanel('edit-center', 'edit-bottom');
      firstProbe.current?.togglePanel('overlay-main', 'overlay-right');
    });

    firstRender.unmount();

    const secondProbe: HookProbe = { current: null };
    render(<HookHarness probe={secondProbe} />);

    act(() => {
      secondProbe.current?.registerSplit(SHOW_MAIN_DEFINITION);
      secondProbe.current?.registerSplit(EDIT_MAIN_DEFINITION);
      secondProbe.current?.registerSplit(EDIT_CENTER_DEFINITION);
      secondProbe.current?.registerSplit(OVERLAY_MAIN_DEFINITION);
    });

    expect(secondProbe.current?.isPanelVisible('show-main', 'show-right')).toBe(false);
    expect(secondProbe.current?.isPanelVisible('edit-main', 'edit-left')).toBe(false);
    expect(secondProbe.current?.isPanelVisible('edit-center', 'edit-bottom')).toBe(false);
    expect(secondProbe.current?.isPanelVisible('overlay-main', 'overlay-right')).toBe(false);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
  });

  it('keeps overlay visibility independent from edit visibility', () => {
    const probe: HookProbe = { current: null };

    render(<HookHarness probe={probe} />);

    act(() => {
      probe.current?.registerSplit(EDIT_MAIN_DEFINITION);
      probe.current?.registerSplit(OVERLAY_MAIN_DEFINITION);
      probe.current?.togglePanel('edit-main', 'edit-left');
    });

    expect(probe.current?.isPanelVisible('edit-main', 'edit-left')).toBe(false);
    expect(probe.current?.isPanelVisible('overlay-main', 'overlay-left')).toBe(true);

    act(() => {
      probe.current?.togglePanel('overlay-main', 'overlay-left');
    });

    expect(probe.current?.isPanelVisible('edit-main', 'edit-left')).toBe(false);
    expect(probe.current?.isPanelVisible('overlay-main', 'overlay-left')).toBe(false);
  });

  it('returns default visibility for registered nested splits', () => {
    const probe: HookProbe = { current: null };

    render(<HookHarness probe={probe} />);

    act(() => {
      probe.current?.registerSplit(SHOW_CENTER_DEFINITION);
    });

    expect(probe.current?.isPanelVisible('show-center', 'show-bottom')).toBe(true);
    expect(probe.current?.getSplitLayout(SHOW_CENTER_DEFINITION).panes['show-bottom'].size).toBe(260);
  });
});
