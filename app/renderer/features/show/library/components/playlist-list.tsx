import { Button } from '../../../../components/controls/button';
import { EllipsisVertical, List, Plus } from 'lucide-react';
import { EditableText } from '../../../../components/form/editable-text';

import { SectionHeader } from '../../../../components/display/section-header';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useLibraryBrowser } from '../contexts/library-browser-context';

export function PlaylistList() {
  const { currentLibraryBundle, currentPlaylistId, setCurrentPlaylistId, createPlaylist, renamePlaylist, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { state, actions } = useLibraryBrowser();

  function handleCreate() { void createPlaylist(); }

  if (!currentLibraryBundle) return null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border-b border-border-primary">
      <SectionHeader.Root bordered={false}>
        <SectionHeader.Body>
          <span className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">Playlist</span>
        </SectionHeader.Body>
        <SectionHeader.Trailing>
          <Button label="New playlist" onClick={handleCreate} size="icon-md">
            <Plus size={14} strokeWidth={1.75} />
          </Button>
        </SectionHeader.Trailing>
      </SectionHeader.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1" role="list" aria-label="Playlists">
        {currentLibraryBundle.playlists.map((tree) => {
          const isSelected = tree.playlist.id === currentPlaylistId;
          const isEditing = tree.playlist.id === recentlyCreatedId || tree.playlist.id === state.editingPlaylistId;

          function handleSelect() { setCurrentPlaylistId(tree.playlist.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handlePlaylistContextMenu(event, tree.playlist.id); }
          function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
            event.stopPropagation();
            actions.openPlaylistMenuFromButton(tree.playlist.id, event.currentTarget);
          }
          function handleRename(name: string) {
            void renamePlaylist(tree.playlist.id, name);
            clearRecentlyCreated();
            actions.clearEditingPlaylist();
          }

          return (
            <div key={tree.playlist.id} role="listitem" className="group relative">
              <Button
                variant="ghost"
                active={isSelected}
                onClick={handleSelect}
                onContextMenu={handleContextMenu}
                className="block w-full rounded-sm border-0 px-2 py-1.5 pr-7 text-left text-md hover:bg-background-quaternary/50 hover:text-text-primary"
              >
                <span className="flex items-center gap-2">
                  <List className="shrink-0 text-text-tertiary" size={14} strokeWidth={1.75} />
                  <EditableText
                    value={tree.playlist.name}
                    onCommit={handleRename}
                    editing={isEditing}
                    className="text-md"
                  />
                </span>
              </Button>

              <Button label={`Open ${tree.playlist.name} menu`} onClick={handleMenuButtonClick} size="icon-sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" >
                <EllipsisVertical size={14} strokeWidth={2} />
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
