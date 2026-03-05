import { act } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useWorkbenchPanelLayout, type UseWorkbenchPanelLayoutResult } from './use-workbench-panel-layout';

const STORAGE_KEY = 'cast-interface.workbench-layout.v1';

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
      probe.current?.startDrag({
        splitId: 'show-main',
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
      probe.current?.updateDrag({ splitId: 'show-main', pointerPosition: 180 });
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
      probe.current?.togglePanel('show', 'right');
    });

    expect(probe.current?.panelVisibility.show.right).toBe(false);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('restores persisted layout per view', () => {
    const firstProbe: HookProbe = { current: null };
    const firstRender = render(<HookHarness probe={firstProbe} />);

    act(() => {
      firstProbe.current?.togglePanel('show', 'right');
      firstProbe.current?.togglePanel('edit', 'left');
    });

    firstRender.unmount();

    const secondProbe: HookProbe = { current: null };
    render(<HookHarness probe={secondProbe} />);

    expect(secondProbe.current?.panelVisibility.show.right).toBe(false);
    expect(secondProbe.current?.panelVisibility.edit.left).toBe(false);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
  });
});
