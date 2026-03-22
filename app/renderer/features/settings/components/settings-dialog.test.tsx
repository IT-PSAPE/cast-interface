import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsDialog } from './settings-dialog';

vi.mock('./appearance-settings-panel', () => ({
  AppearanceSettingsPanel: () => <div>Appearance Panel</div>,
}));

vi.mock('./output-settings-panel', () => ({
  OutputSettingsPanel: () => <div>Output Panel</div>,
}));

vi.mock('./overlay-settings-panel', () => ({
  OverlaySettingsPanel: () => <div>Overlay Panel</div>,
}));

vi.mock('./import-export-settings-panel', () => ({
  ImportExportSettingsPanel: () => <div>Import Export Panel</div>,
}));

describe('SettingsDialog', () => {
  it('shows the import/export settings tab', () => {
    render(<SettingsDialog onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Import / Export'));

    expect(screen.getByText('Import Export Panel')).not.toBeNull();
  });
});
