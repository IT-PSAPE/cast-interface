import { ContextMenu } from '../../components/overlays/context-menu';
import { Panel } from '../../components/layout/panel';
import { useLibraryBrowser } from './library-browser-context';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { useLibraryPanelState } from './library-panel-context';
import { Button } from '@renderer/components/controls/button';
import { ChevronLeft, Folder, Plus } from 'lucide-react';
import { PanelRoute } from '../workbench/panel-route';
import { PlaylistList } from './playlist-list';
import { SegmentsBrowser } from './segments-browser';
import { useCast } from '@renderer/contexts/cast-context';
import { Label } from '@renderer/components/display/text';
import { useRef } from 'react';
import { EditableField } from '@renderer/components/form/editable-field';

export function LibraryPanel() {
  const { snapshot } = useCast();
  const { state, actions } = useLibraryBrowser();
  const { currentLibraryBundle } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();

  const { selectLibrary, createLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleCreate() { void createLibrary(); }

  function handleBack() {
    actions.setLibrariesView();
  }

  return (
    <Panel as="aside" bordered="right" data-ui-region="library-panel">

      {((libraryPanelView === 'libraries') && snapshot) &&
        <>
          <Panel.Header>
            <Label.sm className='pl-1 mr-auto'>Library</Label.sm>
            <Button.Icon label="New library" onClick={handleCreate}>
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
        </>
      }


      {(libraryPanelView === 'playlist' && currentLibraryBundle) &&
        <>
          <Panel.Header>
            <Button.Icon label="New library" onClick={handleBack}>
              <ChevronLeft />
            </Button.Icon>
            <Label.sm className='pl-1 mr-auto'>{currentLibraryBundle.library.name}</Label.sm>
          </Panel.Header>

          <PanelRoute.Split splitId="library-panel" orientation="vertical" className="flex-1">
            <PanelRoute.Panel id="library-playlists" defaultSize={200} minSize={120}>
              <PlaylistList />
            </PanelRoute.Panel>
            <PanelRoute.Panel id="library-segments" defaultSize={320} minSize={180}>
              <SegmentsBrowser />
            </PanelRoute.Panel>
          </PanelRoute.Split>
        </>
      }

      {state.menuState ? <ContextMenu x={state.menuState.x} y={state.menuState.y} items={state.menuItems} onClose={actions.closeMenu} /> : null}
    </Panel>
  );
}