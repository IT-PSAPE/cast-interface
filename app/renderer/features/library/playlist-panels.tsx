import { ChevronLeft, List, Plus } from 'lucide-react';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { ReacstButton } from '@renderer/components 2.0/button';
import { Label } from '@renderer/components/display/text';
import { SplitPanel } from '@renderer/features/workbench/split-panel';
import { useLibraryBrowser } from './library-browser-context';
import { SegmentsBrowser } from './segments-browser';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { ScrollArea } from '@renderer/components/layout/scroll-area';
import { PlaylistTree } from '@core/types';
import { RenameField, RenameFieldHandle } from '@renderer/components 2.0/rename-field';
import { useEffect, useRef } from 'react';
import { useLibraryPanelState } from './library-panel-context';

export function PlaylistPanels() {
  const { currentLibraryBundle, createPlaylist } = useNavigation();
  const { actions } = useLibraryBrowser();
  const { libraryPanelView } = useLibraryPanelState();

  function handleCreate() { void createPlaylist(); }

  if (libraryPanelView !== 'playlist' || !currentLibraryBundle) return null;

  const playlists = currentLibraryBundle.playlists;

  return (
    <RecastPanel.Root className='h-full'>
      <RecastPanel.Group>
        <RecastPanel.GroupTitle>
          <ReacstButton.Icon label="Back to libraries" onClick={actions.setLibrariesView}>
            <ChevronLeft />
          </ReacstButton.Icon>
          <Label.sm className="mr-auto">{currentLibraryBundle.library.name}</Label.sm>
        </RecastPanel.GroupTitle>
        <SplitPanel.Panel splitId="library-panel" orientation="vertical" className="flex-1">
          <SplitPanel.Segment id="library-playlists" defaultSize={200} minSize={120}>
            <RecastPanel.Group>
              <RecastPanel.GroupTitle>
                <Label.xs className='mr-auto'>Playlists</Label.xs>
                <ReacstButton.Icon onClick={handleCreate}>
                  <Plus />
                </ReacstButton.Icon>
              </RecastPanel.GroupTitle>
            </RecastPanel.Group>

            <RecastPanel.GroupContent className="py-1.5 space-y-1">
              <ScrollArea.Root>
                <ScrollArea.Viewport role="list" aria-label="Playlists">
                  {playlists.map((tree) => <PlaylistRow key={tree.playlist.id} tree={tree} />)}
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar>
                  <ScrollArea.Thumb />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </RecastPanel.GroupContent>
          </SplitPanel.Segment>
          <SplitPanel.Segment id="library-segments" defaultSize={320} minSize={180}>
            <SegmentsBrowser />
          </SplitPanel.Segment>
        </SplitPanel.Panel>
      </RecastPanel.Group>
    </RecastPanel.Root>
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
