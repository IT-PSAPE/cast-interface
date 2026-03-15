import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StagePanel } from '../../stage/components/stage-panel';

const useCastMock = vi.fn();
const useNavigationMock = vi.fn();
const useProjectContentMock = vi.fn();
const useSlidesMock = vi.fn();
const useElementsMock = vi.fn();
const useOverlayEditorMock = vi.fn();
const useTemplateEditorMock = vi.fn();
const useWorkbenchMock = vi.fn();

vi.mock('../../../contexts/cast-context', () => ({
  useCast: () => useCastMock(),
}));

vi.mock('../../../contexts/use-project-content', () => ({
  useProjectContent: () => useProjectContentMock(),
}));

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

vi.mock('../../../contexts/element-context', () => ({
  useElements: () => useElementsMock(),
}));

vi.mock('../../../contexts/overlay-editor-context', () => ({
  useOverlayEditor: () => useOverlayEditorMock(),
}));

vi.mock('../../../contexts/template-editor-context', () => ({
  useTemplateEditor: () => useTemplateEditorMock(),
}));

vi.mock('../../../contexts/workbench-context', () => ({
  useWorkbench: () => useWorkbenchMock(),
}));

vi.mock('../../stage/components/stage-viewport', () => ({
  StageViewport: function StageViewport() {
    return <div>Canvas Stage</div>;
  },
}));

describe('StagePanel', () => {
  it('renders the overlay canvas when overlay-editor has overlay elements', () => {
    useCastMock.mockReturnValue({ setStatusText: vi.fn() });
    useNavigationMock.mockReturnValue({ currentPresentation: null });
    useProjectContentMock.mockReturnValue({ mediaAssets: [] });
    useSlidesMock.mockReturnValue({ currentSlide: null });
    useOverlayEditorMock.mockReturnValue({ currentOverlay: { id: 'overlay-1' } });
    useTemplateEditorMock.mockReturnValue({
      templates: [],
      currentTemplateId: null,
      currentTemplate: null,
      hasPendingChanges: false,
      isPushingChanges: false,
      setCurrentTemplateId: vi.fn(),
      openTemplateEditor: vi.fn(),
      updateTemplateDraft: vi.fn(),
      replaceTemplateElements: vi.fn(),
      createTemplate: vi.fn(),
      applyTemplateToTarget: vi.fn(),
      deleteTemplate: vi.fn(),
      duplicateTemplate: vi.fn(),
      renameTemplate: vi.fn(),
      pushChanges: vi.fn(),
    });
    useWorkbenchMock.mockReturnValue({ workbenchMode: 'overlay-editor' });
    useElementsMock.mockReturnValue({
      selectedElement: null,
      elementDraft: null,
      createText: vi.fn(),
      createShape: vi.fn(),
      createFromMedia: vi.fn(),
    });

    render(<StagePanel />);

    expect(screen.getByText('Canvas Stage')).not.toBeNull();
    expect(screen.queryByText('No overlay selected.')).toBeNull();
  });

  it('renders the overlay empty state when no overlay is selected', () => {
    useCastMock.mockReturnValue({ setStatusText: vi.fn() });
    useNavigationMock.mockReturnValue({ currentPresentation: null });
    useProjectContentMock.mockReturnValue({ mediaAssets: [] });
    useSlidesMock.mockReturnValue({ currentSlide: null });
    useOverlayEditorMock.mockReturnValue({ currentOverlay: null });
    useTemplateEditorMock.mockReturnValue({
      templates: [],
      currentTemplateId: null,
      currentTemplate: null,
      hasPendingChanges: false,
      isPushingChanges: false,
      setCurrentTemplateId: vi.fn(),
      openTemplateEditor: vi.fn(),
      updateTemplateDraft: vi.fn(),
      replaceTemplateElements: vi.fn(),
      createTemplate: vi.fn(),
      applyTemplateToTarget: vi.fn(),
      deleteTemplate: vi.fn(),
      duplicateTemplate: vi.fn(),
      renameTemplate: vi.fn(),
      pushChanges: vi.fn(),
    });
    useWorkbenchMock.mockReturnValue({ workbenchMode: 'overlay-editor' });
    useElementsMock.mockReturnValue({
      selectedElement: null,
      elementDraft: null,
      createText: vi.fn(),
      createShape: vi.fn(),
      createFromMedia: vi.fn(),
    });

    render(<StagePanel />);

    expect(screen.getByText('No overlay selected.')).not.toBeNull();
  });
});
