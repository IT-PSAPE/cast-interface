import { Button } from '../../components/controls/button';
import { EllipsisVertical, List, Plus } from 'lucide-react';
import { EditableField } from '../../components/form/editable-field';
import { Panel } from '../../components/layout/panel';

import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';

export function PlaylistList() {
  const { currentLibraryBundle, currentPlaylistId, setCurrentPlaylistId, createPlaylist, renamePlaylist, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { state, actions } = useLibraryBrowser();

  function handleCreate() { void createPlaylist(); }

  if (!currentLibraryBundle) return null;

  return (
    <Panel as="section" className="border-b border-primary">
      <Panel.Header>
        <span className="text-sm font-semibold text-tertiary uppercase tracking-wider mr-auto">Playlist</span>
        <Button.Icon label="New playlist" onClick={handleCreate}>
          <Plus/>
        </Button.Icon>
      </Panel.Header>

      <Panel.Body className="px-1.5 py-1.5 space-y-1" role="list" aria-label="Playlists">
        {currentLibraryBundle.playlists.map((tree) => {
          const isSelected = tree.playlist.id === currentPlaylistId;
          const isEditing = tree.playlist.id === recentlyCreatedId || actions.isEditing('playlist', tree.playlist.id);

          function handleSelect() { setCurrentPlaylistId(tree.playlist.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handlePlaylistContextMenu(event, tree.playlist.id); }
          function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
            event.stopPropagation();
            actions.openPlaylistMenuFromButton(tree.playlist.id, event.currentTarget);
          }
          function handleRename(name: string) {
            void renamePlaylist(tree.playlist.id, name);
            clearRecentlyCreated();
            actions.clearEditing();
          }

          return (
            <div key={tree.playlist.id} role="listitem" className="group relative">
              <Button
                variant="ghost"
                active={isSelected}
                onClick={handleSelect}
                onContextMenu={handleContextMenu}
                className="block w-full rounded-sm border-0 px-2 py-1.5 pr-7 text-left text-md hover:bg-quaternary/50 hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <List className="shrink-0 text-tertiary" size={14} strokeWidth={1.75} />
                  <EditableField
                    value={tree.playlist.name}
                    onCommit={handleRename}
                    editing={isEditing}
                    className="text-md"
                  />
                </span>
              </Button>

              <Button.Icon label={`Open ${tree.playlist.name} menu`} onClick={handleMenuButtonClick} variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" >
                <EllipsisVertical />
              </Button.Icon>
            </div>
          );
        })}
      </Panel.Body>
    </Panel>
  );
}
