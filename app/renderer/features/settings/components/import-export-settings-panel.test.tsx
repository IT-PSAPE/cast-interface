import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImportExportSettingsPanel } from './import-export-settings-panel';

const useImportExportSettingsMock = vi.fn();

vi.mock('../hooks/use-import-export-settings', () => ({
  useImportExportSettings: () => useImportExportSettingsMock(),
}));

describe('ImportExportSettingsPanel', () => {
  it('renders review controls for broken bundle references', () => {
    const chooseReplacementPath = vi.fn(async () => undefined);

    useImportExportSettingsMock.mockReturnValue({
      state: {
        contentItems: [{ id: 'deck-1', type: 'deck', title: 'Welcome', order: 0, createdAt: '', updatedAt: '', templateId: null }],
        filterText: '',
        selectedIds: new Set(['deck-1']),
        selectedCount: 1,
        exportInFlight: false,
        importInFlight: false,
        importPath: '/tmp/import.cst',
        inspection: {
          exportedAt: '',
          itemCount: 1,
          templateCount: 1,
          mediaReferenceCount: 2,
          items: [{ id: 'deck-1', title: 'Welcome', type: 'deck', slideCount: 2, templateId: 'template-1' }],
          templates: [{ id: 'template-1', name: 'Welcome Template', kind: 'slides' }],
          mediaReferences: [],
          brokenReferences: [{
            source: 'cast-media:///missing.png',
            elementTypes: ['image'],
            occurrenceCount: 2,
            itemTitles: ['Welcome'],
            templateNames: ['Welcome Template'],
          }],
        },
        decisionMap: new Map([['cast-media:///missing.png', { action: 'replace', replacementPath: null }]]),
        blockedImportReasons: ['Choose a replacement file for cast-media:///missing.png'],
        message: null,
      },
      actions: {
        setFilterText: vi.fn(),
        toggleSelectedId: vi.fn(),
        selectAllVisible: vi.fn(),
        clearSelection: vi.fn(),
        exportSelected: vi.fn(async () => undefined),
        chooseImportBundle: vi.fn(async () => undefined),
        clearImportReview: vi.fn(),
        setBrokenReferenceAction: vi.fn(),
        chooseReplacementPath,
        finalizeImport: vi.fn(async () => undefined),
      },
    });

    render(<ImportExportSettingsPanel />);

    expect(screen.getByText('Export Selected (1)')).not.toBeNull();
    expect(screen.getByText('cast-media:///missing.png')).not.toBeNull();
    expect(screen.getByText('Choose Bundle')).not.toBeNull();
    expect(screen.getByText('Import')).not.toBeNull();

    fireEvent.click(screen.getByText('Choose File'));
    expect(chooseReplacementPath).toHaveBeenCalledWith('cast-media:///missing.png');
  });
});
