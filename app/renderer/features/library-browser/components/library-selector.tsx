import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
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
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Library</span>
        <IconButton label="New library" onClick={handleCreate} size="sm" variant="ghost">
          <Icon.plus size={12} strokeWidth={1.5} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1" role="list" aria-label="Libraries">
        {snapshot.libraryBundles.map((bundle) => {
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
              active={isSelected}
              key={bundle.library.id}
              role="listitem"
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className="block w-full rounded-sm border-0 px-2 py-1.5 text-left hover:bg-background-quaternary/50 hover:text-text-primary"
            >
              <span className="flex items-center gap-2">
                <Icon.folder className="shrink-0 text-text-tertiary" size={14} strokeWidth={1.75} />
                <EditableText
                  value={bundle.library.name}
                  onCommit={handleRename}
                  editing={isEditing}
                  className="text-[13px] font-medium"
                />
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
