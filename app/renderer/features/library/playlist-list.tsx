import { useEffect, useRef } from 'react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { List, Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RenameField, type RenameFieldHandle } from '@renderer/components 2.0/rename-field';
import { ScrollArea } from '../../components/layout/scroll-area';

import { useNavigation } from '../../contexts/navigation-context';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { Label } from '@renderer/components/display/text';
import { PlaylistTree } from '@core/types';

export function PlaylistList() {
  const { currentLibraryBundle, createPlaylist } = useNavigation();

  function handleCreate() { void createPlaylist(); }

  if (!currentLibraryBundle) return null;

  const playlists = currentLibraryBundle.playlists;

  return (
    <>
      <RecastPanel.Group>
        <RecastPanel.GroupTitle>
          <Label.xs className='mr-auto'>Playlists</Label.xs>
          <ReacstButton.Icon onClick={handleCreate}> 
            <Plus />
          </ReacstButton.Icon>
        </RecastPanel.GroupTitle>
      </RecastPanel.Group>

      <RecastPanel.GroupContent className="py-1.5 space-y-1">
        <ScrollArea role="list" aria-label="Playlists">
          <SortableContext items={playlists.map((tree) => tree.playlist.id)} strategy={verticalListSortingStrategy}>
            {playlists.map((tree) => <PlaylistRow key={tree.playlist.id}tree={tree} />)}
          </SortableContext>
        </ScrollArea>
      </RecastPanel.GroupContent>
    </>
  );
}

function PlaylistRow({ tree }: { tree: PlaylistTree }) {
  const { currentPlaylistId, setCurrentPlaylistId, renamePlaylist, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const renameRef = useRef<RenameFieldHandle>(null);

  const isSelected = tree.playlist.id === currentPlaylistId;
  const isEditing = tree.playlist.id === recentlyCreatedId;

  useEffect(() => {
    if (isEditing) renameRef.current?.startEditing();
  }, [isEditing]);

  function handleRename(name: string) {
    void renamePlaylist(tree.playlist.id, name);
    clearRecentlyCreated();
  }

  function handleSelect() { setCurrentPlaylistId(tree.playlist.id); }

  return (
    <RecastPanel.MenuItem active={isSelected} onClick={handleSelect}>
      <List className='size-4' />
      <RenameField ref={renameRef} value={tree.playlist.name} onValueChange={handleRename} className="label-xs" />
    </RecastPanel.MenuItem>
  );
}
