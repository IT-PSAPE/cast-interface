import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ContextMenu, useContextMenu, useContextMenuTrigger } from '../../../../../app/renderer/components/overlays/context-menu';

const overlayStack = {
  rootElement: null as HTMLElement | null,
  stack: [] as string[],
  baseZIndex: 1000,
  register: () => undefined,
  unregister: () => undefined,
};

vi.mock('@renderer/contexts/workbench-context', () => ({
  useWorkbench: () => ({ state: {}, actions: {}, overlayStack }),
}));

function TriggerRow({ disabled = false }: { disabled?: boolean }) {
  const { ref, ...handlers } = useContextMenuTrigger({ disabled });
  return <div {...handlers} ref={ref} data-testid="row">Row</div>;
}

afterEach(cleanup);

describe('useContextMenuTrigger', () => {
  it('stays inert outside a ContextMenu.Root so a row body can also render as its drag overlay', () => {
    render(<TriggerRow />);
    const row = screen.getByTestId('row');

    // fireEvent returns false when the handler called preventDefault — an inert
    // trigger must leave the event alone so nothing tries to open a menu.
    expect(fireEvent.contextMenu(row)).toBe(true);
    expect(row.dataset.state).toBe('closed');
  });

  it('opens at the pointer inside a ContextMenu.Root', () => {
    render(<ContextMenu.Root><TriggerRow /></ContextMenu.Root>);
    const row = screen.getByTestId('row');

    expect(fireEvent.contextMenu(row, { clientX: 24, clientY: 36 })).toBe(false);
    expect(row.dataset.state).toBe('open');
  });

  it('stays closed when the caller disables it', () => {
    render(<ContextMenu.Root><TriggerRow disabled /></ContextMenu.Root>);
    const row = screen.getByTestId('row');

    expect(fireEvent.contextMenu(row)).toBe(true);
    expect(row.dataset.state).toBe('closed');
  });
});

describe('useContextMenu', () => {
  it('still rejects menu parts rendered outside a ContextMenu.Root', () => {
    function Orphan() {
      useContextMenu();
      return null;
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Orphan />)).toThrow('ContextMenu components must be used within ContextMenu.Root');

    consoleError.mockRestore();
  });
});
