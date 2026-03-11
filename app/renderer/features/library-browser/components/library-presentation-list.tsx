import { Button } from '../../../components/button';
import { ContextMenu } from '../../../components/context-menu';
import { EditableText } from '../../../components/editable-text';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PresentationEntityIcon } from '../../../components/presentation-entity-icon';
import { useCreatePresentationMenu } from '../../../hooks/use-create-presentation-menu';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';

interface LibraryPresentationListProps {
  editingPresentationId: string | null;
  onLibraryPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, presentationId: string) => void;
  onLibraryPresentationMenuButtonClick: (presentationId: string, button: HTMLElement) => void;
  onClearEditingPresentation: () => void;
}

export function LibraryPresentationList({ editingPresentationId, onLibraryPresentationContextMenu, onLibraryPresentationMenuButtonClick, onClearEditingPresentation }: LibraryPresentationListProps) {
  const { browsePresentation, createPresentation, createLyric, currentDrawerPresentationId, isDetachedPresentationBrowser, renamePresentation } = useNavigation();
  const { presentations } = useProjectContent();
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreatePresentationMenu({
    createPresentation,
    createLyric
  });

  function handleNewPresentation(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

  return (
    <section className="border-t border-border-primary min-h-0 overflow-auto">
      <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-primary z-10">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
          Project Items
        </span>
        <IconButton label="New item" onClick={handleNewPresentation} size="sm">
          <Icon.file_plus_02 size={12} strokeWidth={1.5} />
        </IconButton>
      </div>

      <div className="px-1 pb-1">
        {presentations.map((presentation) => {
          const isSelected = isDetachedPresentationBrowser && presentation.id === currentDrawerPresentationId;
          const isEditing = presentation.id === editingPresentationId;

          function handleSelect() { browsePresentation(presentation.id); }
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
                active={isSelected}
                onClick={handleSelect}
                onContextMenu={handleContextMenu}
                className="block w-full rounded-sm border-0 px-2 py-1 pr-7 text-left text-[13px] hover:bg-background-quaternary/50 hover:text-text-primary"
              >
                <span className="flex items-center gap-2">
                  <PresentationEntityIcon entity={presentation} className="shrink-0 text-text-tertiary" />
                  <EditableText
                    value={presentation.title}
                    onCommit={handleRename}
                    editing={isEditing}
                    className="text-[13px]"
                  />
                </span>
              </Button>

              <IconButton
                label={`Open ${presentation.title} menu`}
                onClick={handleMenuButtonClick}
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-transparent text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-border-primary hover:text-text-primary"
              >
                <Icon.dots_vertical size={14} strokeWidth={2} />
              </IconButton>
            </div>
          );
        })}
      </div>

      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </section>
  );
}
