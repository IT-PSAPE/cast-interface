import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlideBrowserToolbar } from './slide-browser-toolbar';

const useNavigationMock = vi.fn();
const useSlideBrowserMock = vi.fn();
const useSlidesMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/slide-browser-context', () => ({
  useSlideBrowser: () => useSlideBrowserMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

vi.mock('./playlist-browser-mode-control', () => ({
  PlaylistBrowserModeControl: function PlaylistBrowserModeControl() {
    return <div>Playlist Mode Control</div>;
  },
}));

vi.mock('./slide-browser-mode-control', () => ({
  SlideBrowserModeControl: function SlideBrowserModeControl() {
    return <div>Slide Mode Control</div>;
  },
}));

describe('SlideBrowserToolbar', () => {
  beforeEach(() => {
    useNavigationMock.mockReturnValue({
      currentPresentation: { id: 'presentation-1', title: 'Hello World' },
      isDetachedPresentationBrowser: false,
    });
    useSlideBrowserMock.mockReturnValue({
      slideBrowserMode: 'grid',
    });
    useSlidesMock.mockReturnValue({
      createSlide: vi.fn(),
    });
  });

  it('shows playlist and slide mode controls side by side in grid and list views', () => {
    render(<SlideBrowserToolbar />);

    expect(screen.getByText('Playlist Mode Control')).not.toBeNull();
    expect(screen.getByText('Slide Mode Control')).not.toBeNull();
  });

  it('hides the playlist mode control outside grid and list views', () => {
    useSlideBrowserMock.mockReturnValue({
      slideBrowserMode: 'focus',
    });

    render(<SlideBrowserToolbar />);

    expect(screen.queryByText('Playlist Mode Control')).toBeNull();
    expect(screen.getByText('Slide Mode Control')).not.toBeNull();
  });
});
