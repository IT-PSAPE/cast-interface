import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlaylistTree } from '@core/types';
import { PlaylistItemList } from './playlist-item-list';
import { LibraryPanelProvider } from '../contexts/library-panel-context';

const useNavigationMock = vi.fn();
const useSlidesMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

describe('PlaylistItemList', () => {
  it('remembers collapsed segments when the show-mode list unmounts and remounts', () => {
    useNavigationMock.mockReturnValue({ currentPlaylistContentItemId: null, createSegment: vi.fn() });
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

    const props = {
      tree,
      editingSegmentId: null,
      editingPresentationId: null,
      onSegmentContextMenu: vi.fn(),
      onSegmentMenuButtonClick: vi.fn(),
      onSegmentPresentationContextMenu: vi.fn(),
      onSegmentPresentationMenuButtonClick: vi.fn(),
      onRenameSegment: vi.fn(),
      onRenamePresentation: vi.fn(),
      onClearEditingSegment: vi.fn(),
      onClearEditingPresentation: vi.fn(),
    };

    const { rerender } = render(
      <LibraryPanelProvider>
        <PlaylistItemList {...props} />
      </LibraryPanelProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Verse' }));
    expect(screen.queryByText('Song Title')).toBeNull();

    rerender(<LibraryPanelProvider>{null}</LibraryPanelProvider>);
    rerender(
      <LibraryPanelProvider>
        <PlaylistItemList {...props} />
      </LibraryPanelProvider>
    );

    expect(screen.getByRole('button', { name: 'Expand Verse' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Song Title')).toBeNull();
  });
});
