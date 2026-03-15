import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TemplateBinPanel } from './template-bin-panel';

const useNavigationMock = vi.fn();
const useOverlayEditorMock = vi.fn();
const useTemplateEditorMock = vi.fn();
const useProjectContentMock = vi.fn();
const useWorkbenchMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/overlay-editor-context', () => ({
  useOverlayEditor: () => useOverlayEditorMock(),
}));

vi.mock('../../../contexts/template-editor-context', () => ({
  useTemplateEditor: () => useTemplateEditorMock(),
}));

vi.mock('../../../contexts/use-project-content', () => ({
  useProjectContent: () => useProjectContentMock(),
}));

vi.mock('../../../contexts/workbench-context', () => ({
  useWorkbench: () => useWorkbenchMock(),
}));

vi.mock('../../template-editor/components/template-card', () => ({
  TemplateCard: function TemplateCard({ template, onOpenMenu }: { template: { name: string }; onOpenMenu?: (button: HTMLButtonElement) => void }) {
    function handleOpenMenu(event: React.MouseEvent<HTMLButtonElement>) {
      onOpenMenu?.(event.currentTarget);
    }

    return (
      <button type="button" onClick={handleOpenMenu}>
        {template.name}
      </button>
    );
  },
}));

describe('TemplateBinPanel', () => {
  it('applies templates to the playlist-selected presentation when it differs from the current presentation reference', () => {
    const applyTemplateToTarget = vi.fn();

    useProjectContentMock.mockReturnValue({
      templates: [{ id: 'template-1', name: 'Slide Template', kind: 'slides' }],
    });
    useNavigationMock.mockReturnValue({
      currentPlaylistPresentation: { id: 'presentation-1', kind: 'canvas' },
      currentPresentation: { id: 'presentation-2', kind: 'canvas' },
    });
    useOverlayEditorMock.mockReturnValue({ currentOverlay: null });
    useTemplateEditorMock.mockReturnValue({
      applyTemplateToTarget,
      currentTemplateId: null,
      deleteTemplate: vi.fn(),
      duplicateTemplate: vi.fn(),
      openTemplateEditor: vi.fn(),
      renameTemplate: vi.fn(),
    });
    useWorkbenchMock.mockReturnValue({
      workbenchMode: 'show',
      setWorkbenchMode: vi.fn(),
    });

    render(<TemplateBinPanel filterText="" />);

    fireEvent.click(screen.getByRole('button', { name: 'Slide Template' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply and Assign to Current Presentation' }));

    expect(applyTemplateToTarget).toHaveBeenCalledWith('template-1', {
      type: 'presentation',
      presentationId: 'presentation-1',
    });
  });
});
