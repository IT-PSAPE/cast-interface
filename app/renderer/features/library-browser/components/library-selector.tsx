import { Button } from '../../../components/button';
import { IconButton } from '../../../components/icon-button';
import { useCast } from '../../../contexts/cast-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { EditableText } from '../../../components/editable-text';
import { useLibraryPanelState } from '../contexts/library-panel-context';

interface LibrarySelectorProps {
  editingLibraryId: string | null;
  onLibraryContextMenu: (event: React.MouseEvent<HTMLElement>, libraryId: string) => void;
  onClearEditingLibrary: () => void;
}

export function LibrarySelector({ editingLibraryId, onLibraryContextMenu, onClearEditingLibrary }: LibrarySelectorProps) {
  const { snapshot } = useCast();
  const { currentLibraryId, selectLibrary, createLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();
  const { setLibraryPanelView } = useLibraryPanelState();

  function handleCreate() { void createLibrary(); }

  if (!snapshot) return null;

  return (
    <section className="min-h-0 overflow-auto">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Library</span>
        <IconButton label="New library" onClick={handleCreate} className="h-6 w-6 border-transparent bg-transparent text-[16px] leading-none">+</IconButton>
      </div>

      <div className="px-1 pb-1" role="list" aria-label="Libraries">
        {snapshot.bundles.map((bundle) => {
          const isSelected = bundle.library.id === currentLibraryId;
          const isEditing = bundle.library.id === recentlyCreatedId || bundle.library.id === editingLibraryId;

          function handleSelect() {
            selectLibrary(bundle.library.id);
            setLibraryPanelView('playlist');
          }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { onLibraryContextMenu(event, bundle.library.id); }
          function handleRename(name: string) {
            void renameLibrary(bundle.library.id, name);
            clearRecentlyCreated();
            onClearEditingLibrary();
          }

          return (
            <Button
              variant="ghost"
              key={bundle.library.id}
              role="listitem"
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className={`block w-full rounded-sm border-0 px-2 py-1.5 text-left transition-colors ${
                isSelected
                  ? 'bg-selected/15 text-text-primary'
                  : 'bg-transparent text-text-secondary hover:bg-surface-3/50 hover:text-text-primary'
              }`}
            >
              <EditableText
                value={bundle.library.name}
                onCommit={handleRename}
                editing={isEditing}
                className="text-[13px] font-medium"
              />
              <div className="text-[11px] text-text-muted mt-0.5">
                {bundle.playlists.length} playlists · {bundle.presentations.length} presentations
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
