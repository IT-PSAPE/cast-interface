import { useRef } from 'react';
import { Button } from '../../components/controls/button';
import { EditableField } from '../../components/form/editable-field';
import { Folder, Plus } from 'lucide-react';

import { SectionHeader } from '../../components/display/section-header';
import { useCast } from '../../contexts/cast-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';
import { useLibraryPanelState } from './library-panel-context';
import { Panel } from '@renderer/components/panel';
import { Label } from '@renderer/components/display/text';

export function LibraryBrowser() {
  const { snapshot } = useCast();
  const { currentLibraryId, selectLibrary, createLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();
  const { state, actions } = useLibraryBrowser();
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleCreate() { void createLibrary(); }

  if (libraryPanelView !== 'libraries') return null;
  if (!snapshot) return null;

  return (
    <Panel.Root>
      <Panel.Header>
        <Label.sm className='pl-1 mr-auto'>Library</Label.sm>
        <Button.Icon label="New library" onClick={handleCreate} variant="ghost">
          <Plus />
        </Button.Icon>
      </Panel.Header>
      <Panel.Section className='px-1.5 py-2 space-y-1'>
        {snapshot.libraryBundles.map((bundle) => {
          const isEditing = bundle.library.id === recentlyCreatedId || actions.isEditing('library', bundle.library.id);

          function handleSelect() {
            clearTimeout(clickTimer.current);
            selectLibrary(bundle.library.id);
            clickTimer.current = setTimeout(() => { actions.setPlaylistView(); }, 250);
          }

          function handleDoubleClick() {
            clearTimeout(clickTimer.current);
          }

          function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
            actions.handleLibraryContextMenu(event, bundle.library.id);
          }

          function handleRename(name: string) {
            void renameLibrary(bundle.library.id, name);
            clearRecentlyCreated();
            actions.clearEditing();
          }

          return (
            <Panel.Item
              key={bundle.library.id}
              role="button"
              onClick={handleSelect}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
              leading={<Folder size={14} strokeWidth={1.75} />}
            >
              <EditableField
                value={bundle.library.name}
                onCommit={handleRename}
                editing={isEditing}
                className="text-md font-medium"
              />
            </Panel.Item>
          );
        })}
      </Panel.Section>
    </Panel.Root>
  )
}