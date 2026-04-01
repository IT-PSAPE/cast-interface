import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WindowsInlineMenuBar } from './windows-inline-menu-bar';

describe('WindowsInlineMenuBar', () => {
  const getInlineWindowMenuItems = vi.fn();
  const popupInlineWindowMenu = vi.fn();

  beforeEach(() => {
    getInlineWindowMenuItems.mockReset();
    popupInlineWindowMenu.mockReset();

    window.castApi = {
      platform: 'win32',
      getInlineWindowMenuItems,
      popupInlineWindowMenu,
    } as unknown as typeof window.castApi;
  });

  it('renders top-level menu labels on Windows and opens submenus from clicks', async () => {
    getInlineWindowMenuItems.mockResolvedValue([
      { id: 'file', label: 'File' },
      { id: 'edit', label: 'Edit' },
    ]);
    popupInlineWindowMenu.mockResolvedValue(undefined);

    render(<WindowsInlineMenuBar />);

    await screen.findByRole('button', { name: 'File' });
    fireEvent.click(screen.getByRole('button', { name: 'File' }));

    await waitFor(() => {
      expect(popupInlineWindowMenu).toHaveBeenCalledWith('file', expect.any(Number), expect.any(Number));
    });
  });

  it('stays hidden on macOS', () => {
    window.castApi = {
      platform: 'darwin',
      getInlineWindowMenuItems,
      popupInlineWindowMenu,
    } as unknown as typeof window.castApi;

    const { container } = render(<WindowsInlineMenuBar />);
    expect(container.firstChild).toBeNull();
  });
});
