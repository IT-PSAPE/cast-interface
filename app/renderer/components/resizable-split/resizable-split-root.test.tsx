import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResizableSplitRoot } from './resizable-split-root';

describe('ResizableSplitRoot', () => {
  it('renders an absolute handle and emits pointer resize callbacks', () => {
    const onResizeStart = vi.fn();
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();

    render(
      <div className="h-[240px] w-[900px]">
        <ResizableSplitRoot
          orientation="horizontal"
          className="h-full"
          panes={[
            {
              id: 'left',
              visible: true,
              size: 300,
              minSize: 140,
              maxSize: Number.POSITIVE_INFINITY,
              flexible: false,
              content: <div>Left</div>,
            },
            {
              id: 'center',
              visible: true,
              size: 500,
              minSize: 360,
              maxSize: Number.POSITIVE_INFINITY,
              flexible: true,
              content: <div>Center</div>,
            },
          ]}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      </div>
    );

    const handle = screen.getByRole('separator');
    expect(handle.className).toContain('absolute');

    fireEvent.pointerDown(handle, {
      pointerId: 7,
      pointerType: 'mouse',
      button: 0,
      clientX: 300,
      clientY: 10,
    });

    fireEvent.pointerMove(handle, {
      pointerId: 7,
      pointerType: 'mouse',
      clientX: 340,
      clientY: 10,
    });

    fireEvent.pointerUp(handle, {
      pointerId: 7,
      pointerType: 'mouse',
      clientX: 340,
      clientY: 10,
    });

    expect(onResizeStart).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });
});
