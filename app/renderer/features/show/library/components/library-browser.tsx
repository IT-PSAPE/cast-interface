import { Button } from '../../../../components/controls/button';
import { EditableText } from '../../../../components/form/editable-text';
import { Folder, Plus } from 'lucide-react';

import { SectionHeader } from '../../../../components/display/section-header';
import { useCast } from '../../../../contexts/cast-context';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useLibraryBrowser } from '../contexts/library-browser-context';
import { useLibraryPanelState } from '../contexts/library-panel-context';

export function LibraryBrowser() {
  const { snapshot } = useCast();
  const { currentLibraryId, selectLibrary, createLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();
  const { state, actions } = useLibraryBrowser();

  function handleCreate() { void createLibrary(); }

  if (libraryPanelView !== 'libraries') return null;
  if (!snapshot) return null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <SectionHeader.Root bordered={false}>
        <SectionHeader.Body>
          <span className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">Library</span>
        </SectionHeader.Body>
        <SectionHeader.Trailing>
          <Button label="New library" onClick={handleCreate} variant="ghost" size="icon-md">
            <Plus size={14} strokeWidth={1.75} />
          </Button>
        </SectionHeader.Trailing>
      </SectionHeader.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5" role="list" aria-label="Libraries">
        {snapshot.libraryBundles.map((bundle) => {
          const isSelected = bundle.library.id === currentLibraryId;
          const isEditing = bundle.library.id === recentlyCreatedId || bundle.library.id === state.editingLibraryId;

          function handleSelect() {
            selectLibrary(bundle.library.id);
            actions.setPlaylistView();
          }

          function handleContextMenu(event: React.MouseEvent<HTMLElement>) {
            actions.handleLibraryContextMenu(event, bundle.library.id);
          }

          function handleRename(name: string) {
            void renameLibrary(bundle.library.id, name);
            clearRecentlyCreated();
            actions.clearEditingLibrary();
          }

          return (
            <Button
              variant="ghost"
              active={isSelected}
              key={bundle.library.id}
              role="listitem"
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className="block w-full rounded-sm border-0 px-2 py-1.5 text-left hover:bg-background-quaternary/50 hover:text-text-primary"
            >
              <span className="flex items-center gap-2">
                <Folder className="shrink-0 text-text-tertiary" size={14} strokeWidth={1.75} />
                <EditableText
                  value={bundle.library.name}
                  onCommit={handleRename}
                  editing={isEditing}
                  className="text-md font-medium"
                />
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
