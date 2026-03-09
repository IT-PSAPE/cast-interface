import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
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
  const { currentLibraryBundle, currentPlaylistId, setCurrentPlaylistId, createPlaylist, renamePlaylist, recentlyCreatedId, clearRecentlyCreated } = useNavigation();

  function handleCreate() { void createPlaylist(); }

  if (!currentLibraryBundle) return null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border-b border-border-primary">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Playlist</span>
        <IconButton label="New playlist" onClick={handleCreate} className="h-5 w-5">
          <Icon.plus size={12} strokeWidth={1.5} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1" role="list" aria-label="Playlists">
        {currentLibraryBundle.playlists.map((tree) => {
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
                className={`block w-full rounded-sm border-0 px-2 py-1 pr-7 text-left text-[13px] transition-colors ${
                  isSelected
                    ? 'bg-brand-400/15 text-text-primary'
                    : 'bg-transparent text-text-secondary hover:bg-background-quaternary/50 hover:text-text-primary'
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
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded border border-transparent text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-border-primary hover:text-text-primary"
              >
                <Icon.dots_vertical size={14} strokeWidth={2} />
              </IconButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}
