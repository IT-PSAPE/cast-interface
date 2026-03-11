import { act } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTwoPaneVerticalSplit, type UseTwoPaneVerticalSplitResult } from './use-two-pane-vertical-split';

interface HookProbe {
  current: UseTwoPaneVerticalSplitResult | null;
}

interface HookHarnessProps {
  probe: HookProbe;
}

function HookHarness({ probe }: HookHarnessProps) {
  probe.current = useTwoPaneVerticalSplit({
    topPaneId: 'top',
    bottomPaneId: 'bottom',
    defaultTopSize: 420,
    defaultBottomSize: 240,
    minTopSize: 180,
    minBottomSize: 160,
  });

  return null;
}

describe('useTwoPaneVerticalSplit', () => {
  it('clamps drag movement to the configured minimum sizes', () => {
    const probe: HookProbe = { current: null };
    render(<HookHarness probe={probe} />);

    act(() => {
      probe.current?.handleResizeStart({
        handleIndex: 0,
        pointerPosition: 420,
        paneSizes: {
          top: 420,
          bottom: 240,
        },
      });
    });

    act(() => {
      probe.current?.handleResize({
        handleIndex: 0,
        pointerPosition: 720,
      });
    });

    expect(probe.current?.topSize).toBe(500);
    expect(probe.current?.bottomSize).toBe(160);

    act(() => {
      probe.current?.handleResize({
        handleIndex: 0,
        pointerPosition: -200,
      });
    });

    expect(probe.current?.topSize).toBe(180);
    expect(probe.current?.bottomSize).toBe(480);
  });

  it('stops applying drag updates after the resize session ends', () => {
    const probe: HookProbe = { current: null };
    render(<HookHarness probe={probe} />);

    act(() => {
      probe.current?.handleResizeStart({
        handleIndex: 0,
        pointerPosition: 420,
        paneSizes: {
          top: 420,
          bottom: 240,
        },
      });
    });

    act(() => {
      probe.current?.handleResizeEnd({ handleIndex: 0 });
      probe.current?.handleResize({
        handleIndex: 0,
        pointerPosition: 520,
      });
    });

    expect(probe.current?.topSize).toBe(420);
    expect(probe.current?.bottomSize).toBe(240);
  });
});
