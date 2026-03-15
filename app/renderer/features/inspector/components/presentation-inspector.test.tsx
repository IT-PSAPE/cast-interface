import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PresentationInspector } from './presentation-inspector';

const useNavigationMock = vi.fn();
const useProjectContentMock = vi.fn();
const useTemplateEditorMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/use-project-content', () => ({
  useProjectContent: () => useProjectContentMock(),
}));

vi.mock('../../../contexts/template-editor-context', () => ({
  useTemplateEditor: () => useTemplateEditorMock(),
}));

describe('PresentationInspector', () => {
  it('shows the assigned template and resets through the template editor context', () => {
    const handleReset = vi.fn();

    useNavigationMock.mockReturnValue({
      currentPresentation: {
        id: 'presentation-1',
        title: 'Song',
        kind: 'lyrics',
        entityType: 'lyric',
        templateId: 'template-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      renamePresentation: vi.fn(),
    });
    useProjectContentMock.mockReturnValue({
      templatesById: new Map([['template-1', { id: 'template-1', name: 'Lyric Template Default' }]]),
    });
    useTemplateEditorMock.mockReturnValue({
      resetPresentationToAssignedTemplate: handleReset,
    });

    render(<PresentationInspector />);

    expect(screen.getByText('Lyric Template Default')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reset To Template' }));
    expect(handleReset).toHaveBeenCalledWith('presentation-1');
  });
});
