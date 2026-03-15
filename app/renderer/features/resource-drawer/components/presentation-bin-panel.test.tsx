import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PresentationBinPanel } from './presentation-bin-panel';

const sceneFrameMock = vi.fn();
const useNavigationMock = vi.fn();
const useProjectContentMock = vi.fn();
const useLibraryPanelManagementMock = vi.fn();

vi.mock('../../../components/scene-frame', () => ({
  SceneFrame: function SceneFrame({
    children,
    checkerboard,
  }: {
    children: React.ReactNode;
    checkerboard?: boolean;
  }) {
    sceneFrameMock({ checkerboard });
    return <div data-testid="scene-frame">{children}</div>;
  },
}));

vi.mock('../../stage/rendering/build-render-scene', () => ({
  buildThumbnailScene: () => ({
    width: 1920,
    height: 1080,
    nodes: [],
  }),
}));

vi.mock('../../stage/rendering/scene-stage', () => ({
  SceneStage: function SceneStage() {
    return <div data-testid="scene-stage" />;
  },
}));

vi.mock('../../../components/icon-button', () => ({
  IconButton: function IconButton({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) {
    return <div onClick={onClick}>{children}</div>;
  },
}));

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/use-project-content', () => ({
  useProjectContent: () => useProjectContentMock(),
}));

vi.mock('../../library-browser/hooks/use-library-panel-management', () => ({
  useLibraryPanelManagement: () => useLibraryPanelManagementMock(),
}));

describe('PresentationBinPanel', () => {
  it('renders presentation thumbnails with a checkerboard transparency background', () => {
    useNavigationMock.mockReturnValue({
      currentDrawerPresentationId: null,
      currentPlaylistId: null,
      currentLibraryBundle: null,
      browsePresentation: vi.fn(),
      isDetachedPresentationBrowser: false,
    });
    useProjectContentMock.mockReturnValue({
      presentations: [{ id: 'presentation-1', title: 'Presentation', entityType: 'canvas' }],
      slidesByPresentationId: new Map([
        ['presentation-1', [{ id: 'slide-1', order: 0 }]],
      ]),
      slideElementsBySlideId: new Map([
        ['slide-1', []],
      ]),
    });
    useLibraryPanelManagementMock.mockReturnValue({
      renamePresentation: vi.fn(),
      deletePresentation: vi.fn(),
      movePresentation: vi.fn(),
      movePresentationToSegment: vi.fn(),
    });

    render(<PresentationBinPanel filterText="" />);

    expect(screen.getByTestId('scene-frame')).toBeTruthy();
    expect(sceneFrameMock).toHaveBeenCalledWith({ checkerboard: true });
  });
});
