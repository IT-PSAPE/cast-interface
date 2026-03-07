import { Button } from '../../../components/button';
import { EditableText } from '../../../components/editable-text';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';

interface PlaylistListProps {
  editingPlaylistId: string | null;
  onPlaylistContextMenu: (event: React.MouseEvent<HTMLElement>, playlistId: string) => void;
  onPlaylistMenuButtonClick: (playlistId: string, button: HTMLElement) => void;
  onClearEditingPlaylist: () => void;
}

export function PlaylistList({ editingPlaylistId, onPlaylistContextMenu, onPlaylistMenuButtonClick, onClearEditingPlaylist }: PlaylistListProps) {
  const { activeBundle, currentPlaylistId, setCurrentPlaylistId, createPlaylist, renamePlaylist, recentlyCreatedId, clearRecentlyCreated } = useNavigation();

  function handleCreate() { void createPlaylist(); }

  if (!activeBundle) return null;

  return (
    <section className="border-b border-stroke">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Playlist</span>
        <IconButton label="New playlist" onClick={handleCreate} className="h-5 w-5">
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" aria-hidden="true">
            <path d="M8 3.5V12.5" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M3.5 8H12.5" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>

      <div className="px-1 pb-1" role="list" aria-label="Playlists">
        {activeBundle.playlists.map((tree) => {
          const isSelected = tree.playlist.id === currentPlaylistId;
          const isEditing = tree.playlist.id === recentlyCreatedId || tree.playlist.id === editingPlaylistId;

          function handleSelect() { setCurrentPlaylistId(tree.playlist.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { onPlaylistContextMenu(event, tree.playlist.id); }
          function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
            event.stopPropagation();
            onPlaylistMenuButtonClick(tree.playlist.id, event.currentTarget);
          }
          function handleRename(name: string) {
            void renamePlaylist(tree.playlist.id, name);
            clearRecentlyCreated();
            onClearEditingPlaylist();
          }

          return (
            <div key={tree.playlist.id} role="listitem" className="group relative">
              <Button
                variant="ghost"
                onClick={handleSelect}
                onContextMenu={handleContextMenu}
                className={`block w-full rounded-sm border-0 px-2 py-1 pr-7 text-[13px] transition-colors ${
                  isSelected
                    ? 'bg-selected/15 text-text-primary'
                    : 'bg-transparent text-text-secondary hover:bg-surface-3/50 hover:text-text-primary'
                }`}
              >
                <EditableText
                  value={tree.playlist.name}
                  onCommit={handleRename}
                  editing={isEditing}
                  className="text-[13px]"
                />
              </Button>

              <IconButton
                label={`Open ${tree.playlist.name} menu`}
                onClick={handleMenuButtonClick}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded border border-transparent text-text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-stroke hover:text-text-primary"
              >
                ⋮
              </IconButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}
