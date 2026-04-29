import { useEffect, useRef } from 'react';
import type { LibraryPlaylistBundle } from '@core/types';
import { Folder, Plus } from 'lucide-react';
import { useCast } from '@renderer/contexts/app-context';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { ReacstButton } from '@renderer/components/controls/button';
import { Label } from '@renderer/components/display/text';
import { RenameField, type RenameFieldHandle } from '@renderer/components/form/rename-field';
import { RecastPanel } from '@renderer/components/layout/panel';
import { useLibraryPanelState } from './library-panel-context';

export function LibrariesPanel() {
  const { snapshot } = useCast();
  const { createLibrary } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();

  if (!snapshot || libraryPanelView !== 'libraries') return null;

  return (
    <RecastPanel.Root className='h-full'>
      <RecastPanel.Group>
        <RecastPanel.GroupTitle>
          <Label.sm className="mr-auto">Library</Label.sm>
          <ReacstButton.Icon label="New library" onClick={createLibrary}>
            <Plus />
          </ReacstButton.Icon>
        </RecastPanel.GroupTitle>
        <RecastPanel.GroupContent className='py-2 space-y-1'>
          {snapshot.libraryBundles.map((bundle) => <SortableLibraryRow key={bundle.library.id} bundle={bundle} />)}
        </RecastPanel.GroupContent>
      </RecastPanel.Group>
    </RecastPanel.Root>
  );
}

function SortableLibraryRow({ bundle }: { bundle: LibraryPlaylistBundle }) {
  const { currentLibraryId, selectLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { setLibraryPanelView } = useLibraryPanelState();
  const renameRef = useRef<RenameFieldHandle>(null);

  const isEditing = bundle.library.id === recentlyCreatedId;
  const isSelected = bundle.library.id === currentLibraryId;

  useEffect(() => {
    if (isEditing) renameRef.current?.startEditing();
  }, [isEditing]);

  function handleSelect() {
    selectLibrary(bundle.library.id);
    setLibraryPanelView('playlist');
  }

  function handleRename(name: string) {
    void renameLibrary(bundle.library.id, name);
    clearRecentlyCreated();
  }

  return (
    <RecastPanel.MenuItem active={isSelected} onClick={handleSelect}>
      <Folder className='size-4' />
      <RenameField ref={renameRef} value={bundle.library.name} onValueChange={handleRename} className="label-xs" />
    </RecastPanel.MenuItem>
  );
}
