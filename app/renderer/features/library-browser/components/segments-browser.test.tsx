import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlaylistTree } from '@core/types';
import { SegmentsBrowser } from './segments-browser';
import { LibraryPanelProvider } from '../contexts/library-panel-context';

const useNavigationMock = vi.fn();
const useLibraryBrowserMock = vi.fn();
const useSlidesMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../contexts/library-browser-context', () => ({
  useLibraryBrowser: () => useLibraryBrowserMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

describe('SegmentsBrowser', () => {
  it('remembers collapsed segments when the show-mode list unmounts and remounts', () => {
    window.localStorage.setItem('cast-interface.library-panel-view.v1', 'playlist');
    useNavigationMock.mockReturnValue({ createSegment: vi.fn(), currentPlaylistContentItemId: null });
    useSlidesMock.mockReturnValue({ selectPlaylistContentItem: vi.fn() });

    const tree: PlaylistTree = {
      playlist: { id: 'playlist-1', libraryId: 'library-1', name: 'Sunday', createdAt: '', updatedAt: '' },
      segments: [{
        segment: { id: 'segment-1', playlistId: 'playlist-1', name: 'Verse', colorKey: null, order: 0, createdAt: '', updatedAt: '' },
        entries: [{
          entry: { id: 'entry-1', segmentId: 'segment-1', deckId: null, lyricId: 'presentation-1', order: 0, createdAt: '', updatedAt: '' },
          item: { id: 'presentation-1', title: 'Song Title', type: 'lyric', order: 0, createdAt: '', updatedAt: '' },
        }],
      }],
    };

    useLibraryBrowserMock.mockReturnValue({
      state: {
        selectedTree: tree,
        editingSegmentId: null,
        editingPresentationId: null,
      },
      actions: {
        setLibrariesView: vi.fn(),
        setPlaylistView: vi.fn(),
        renameSegment: vi.fn(),
        renameContentItem: vi.fn(),
        handleLibraryContextMenu: vi.fn(),
        handlePlaylistContextMenu: vi.fn(),
        handleSegmentContextMenu: vi.fn(),
        handleSegmentPresentationContextMenu: vi.fn(),
        openPlaylistMenuFromButton: vi.fn(),
        openSegmentMenuFromButton: vi.fn(),
        openSegmentPresentationMenuFromButton: vi.fn(),
        clearEditingLibrary: vi.fn(),
        clearEditingPlaylist: vi.fn(),
        clearEditingSegment: vi.fn(),
        clearEditingPresentation: vi.fn(),
        closeMenu: vi.fn(),
      },
    });

    const { rerender } = render(
      <LibraryPanelProvider>
        <SegmentsBrowser />
      </LibraryPanelProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Verse' }));
    expect(screen.queryByText('Song Title')).toBeNull();

    rerender(<LibraryPanelProvider>{null}</LibraryPanelProvider>);
    rerender(
      <LibraryPanelProvider>
        <SegmentsBrowser />
      </LibraryPanelProvider>,
    );

    expect(screen.getByRole('button', { name: 'Expand Verse' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Song Title')).toBeNull();
  });
});
