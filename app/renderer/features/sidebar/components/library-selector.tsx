import { useCast } from '../../../contexts/cast-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { EditableText } from '../../../components/editable-text';

interface LibrarySelectorProps {
  editingLibraryId: string | null;
  onLibraryContextMenu: (event: React.MouseEvent<HTMLElement>, libraryId: string) => void;
  onClearEditingLibrary: () => void;
}

export function LibrarySelector({ editingLibraryId, onLibraryContextMenu, onClearEditingLibrary }: LibrarySelectorProps) {
  const { snapshot } = useCast();
  const { currentLibraryId, selectLibrary, createLibrary, renameLibrary, recentlyCreatedId, clearRecentlyCreated } = useNavigation();

  function handleCreate() { void createLibrary(); }

  if (!snapshot) return null;

  return (
    <section className="min-h-0 overflow-auto">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Library</span>
        <button
          onClick={handleCreate}
          className="border-0 bg-transparent text-text-muted cursor-pointer p-0 text-[16px] leading-none hover:text-text-primary transition-colors"
          aria-label="New library"
        >
          +
        </button>
      </div>

      <div className="px-1 pb-1" role="list" aria-label="Libraries">
        {snapshot.bundles.map((bundle) => {
          const isSelected = bundle.library.id === currentLibraryId;
          const isEditing = bundle.library.id === recentlyCreatedId || bundle.library.id === editingLibraryId;

          function handleSelect() { selectLibrary(bundle.library.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { onLibraryContextMenu(event, bundle.library.id); }
          function handleRename(name: string) {
            void renameLibrary(bundle.library.id, name);
            clearRecentlyCreated();
            onClearEditingLibrary();
          }

          return (
            <button
              key={bundle.library.id}
              role="listitem"
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className={`w-full text-left px-2 py-1.5 rounded-sm cursor-pointer border-0 transition-colors block ${
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
