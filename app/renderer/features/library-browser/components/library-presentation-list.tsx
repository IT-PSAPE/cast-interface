import { Button } from '../../../components/button';
import { EditableText } from '../../../components/editable-text';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';

interface LibraryPresentationListProps {
  editingPresentationId: string | null;
  onLibraryPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, presentationId: string) => void;
  onLibraryPresentationMenuButtonClick: (presentationId: string, button: HTMLElement) => void;
  onClearEditingPresentation: () => void;
}

export function LibraryPresentationList({ editingPresentationId, onLibraryPresentationContextMenu, onLibraryPresentationMenuButtonClick, onClearEditingPresentation }: LibraryPresentationListProps) {
  const { activeBundle, currentPresentationId, openPresentation, createPresentation, renamePresentation } = useNavigation();

  function handleNewPresentation() { void createPresentation(); }

  if (!activeBundle) return null;

  return (
    <section className="border-t border-stroke min-h-0 overflow-auto">
      <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-surface-1 z-10">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          Library Presentations
        </span>
        <IconButton label="New presentation" onClick={handleNewPresentation} className="h-5 w-5">
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" aria-hidden="true">
            <path d="M4 2.5H9.5L12.5 5.5V13.5H4V2.5Z" strokeWidth="1.25" />
            <path d="M9.5 2.5V5.5H12.5" strokeWidth="1.25" />
            <path d="M8.25 7.5V11.5" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M6.25 9.5H10.25" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>

      <div className="px-1 pb-1">
        {activeBundle.presentations.map((presentation) => {
          const isSelected = presentation.id === currentPresentationId;
          const isEditing = presentation.id === editingPresentationId;

          function handleSelect() { openPresentation(presentation.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { onLibraryPresentationContextMenu(event, presentation.id); }
          function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
            event.stopPropagation();
            onLibraryPresentationMenuButtonClick(presentation.id, event.currentTarget);
          }
          function handleRename(title: string) {
            void renamePresentation(presentation.id, title);
            onClearEditingPresentation();
          }

          return (
            <div key={presentation.id} className="group relative">
              <Button
                variant="ghost"
                onClick={handleSelect}
                onContextMenu={handleContextMenu}
                className={`block w-full rounded-sm border-0 px-2 py-1 pr-7 text-[13px] transition-colors ${
                  isSelected
                    ? 'bg-selected/15 text-text-primary'
                    : 'bg-transparent text-text-secondary hover:bg-surface-3/50 hover:text-text-primary'
                }`}
              >
                <EditableText
                  value={presentation.title}
                  onCommit={handleRename}
                  editing={isEditing}
                  className="text-[13px]"
                />
              </Button>

              <IconButton
                label={`Open ${presentation.title} menu`}
                onClick={handleMenuButtonClick}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded border border-transparent text-text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-stroke hover:text-text-primary"
              >
                ⋮
              </IconButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}
