import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlideBrowser } from './slide-browser';

const useNavigationMock = vi.fn();
const useSlidesMock = vi.fn();
const useSlideBrowserMock = vi.fn();
const usePlaylistPresentationSequenceMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

vi.mock('../../../contexts/slide-browser-context', () => ({
  useSlideBrowser: () => useSlideBrowserMock(),
}));

vi.mock('../hooks/use-playlist-presentation-sequence', () => ({
  usePlaylistPresentationSequence: () => usePlaylistPresentationSequenceMock(),
}));

vi.mock('./slide-browser-toolbar', () => ({
  SlideBrowserToolbar: function SlideBrowserToolbar() {
    return <div>Toolbar</div>;
  },
}));

vi.mock('../../stage/components/stage-viewport', () => ({
  StageViewport: function StageViewport() {
    return <div>Canvas Stage</div>;
  },
}));

vi.mock('./slide-grid', () => ({
  SlideGrid: function SlideGrid() {
    return <div>Slide Grid</div>;
  },
}));

vi.mock('./slide-list', () => ({
  SlideList: function SlideList() {
    return <div>Slide List</div>;
  },
}));

vi.mock('./continuous-slide-grid', () => ({
  ContinuousSlideGrid: function ContinuousSlideGrid() {
    return <div>Continuous Grid</div>;
  },
}));

vi.mock('./continuous-slide-list', () => ({
  ContinuousSlideList: function ContinuousSlideList() {
    return <div>Continuous Outline</div>;
  },
}));

vi.mock('./slide-browser-playlist-tab-strip', () => ({
  SlideBrowserPlaylistTabStrip: function SlideBrowserPlaylistTabStrip() {
    return <div>Tabs Header</div>;
  },
}));

describe('SlideBrowser', () => {
  beforeEach(() => {
    useNavigationMock.mockReturnValue({
      currentPresentation: { id: 'presentation-1', title: 'Hello World' },
    });
    useSlidesMock.mockReturnValue({
      slides: [{ id: 'slide-1' }, { id: 'slide-2' }],
    });
    usePlaylistPresentationSequenceMock.mockReturnValue({
      items: [
        {
          entryId: 'entry-1',
          occurrenceIndex: 1,
          presentation: { id: 'presentation-1', title: 'Hello World' },
          slides: [{ id: 'slide-1' }, { id: 'slide-2' }],
        },
        {
          entryId: 'entry-2',
          occurrenceIndex: 1,
          presentation: { id: 'presentation-2', title: 'Second Presentation' },
          slides: [{ id: 'slide-3' }],
        },
      ],
    });
  });

  it('renders the presentation strip in single playlist mode', () => {
    useSlideBrowserMock.mockReturnValue({
      slideBrowserMode: 'grid',
      playlistBrowserMode: 'current',
    });

    render(<SlideBrowser />);

    expect(screen.getByText('Hello World')).not.toBeNull();
    expect(screen.getByText('2 slides')).not.toBeNull();
    expect(screen.queryByText('Tabs Header')).toBeNull();
  });

  it('swaps the presentation strip for tabs in tab playlist mode', () => {
    useSlideBrowserMock.mockReturnValue({
      slideBrowserMode: 'grid',
      playlistBrowserMode: 'tabs',
    });

    render(<SlideBrowser />);

    expect(screen.getByText('Tabs Header')).not.toBeNull();
    expect(screen.queryByText('2 slides')).toBeNull();
  });

  it('shows playlist summary metadata in continuous playlist mode', () => {
    useSlideBrowserMock.mockReturnValue({
      slideBrowserMode: 'grid',
      playlistBrowserMode: 'continuous',
    });

    render(<SlideBrowser />);

    expect(screen.getByText('Playlist presentations')).not.toBeNull();
    expect(screen.getByText('2 presentations · 3 slides')).not.toBeNull();
    expect(screen.getByText('Continuous Grid')).not.toBeNull();
  });
});
