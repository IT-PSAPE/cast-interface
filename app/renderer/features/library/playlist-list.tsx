import { Button } from '../../components/controls/button';
import { EllipsisVertical, List, Plus } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableField } from '../../components/form/editable-field';
import { Panel } from '../../components/layout/panel';
import { ScrollArea, useScrollAreaActiveItem } from '../../components/layout/scroll-area';

import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';

export function PlaylistList() {
  const { currentLibraryBundle, currentPlaylistId, setCurrentPlaylistId, createPlaylist, renamePlaylist, recentlyCreatedId, clearRecentlyCreated, reorderPlaylist } = useNavigation();
  const { actions } = useLibraryBrowser();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleCreate() { void createPlaylist(); }

  if (!currentLibraryBundle) return null;

  const playlists = currentLibraryBundle.playlists;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newIndex = playlists.findIndex((tree) => tree.playlist.id === over.id);
    if (newIndex < 0) return;
    void reorderPlaylist(String(active.id), newIndex);
  }

  return (
    <Panel as="section" className="border-b border-primary">
      <Panel.Header>
        <span className="text-sm font-semibold text-tertiary uppercase tracking-wider mr-auto">Playlist</span>
        <Button.Icon label="New playlist" onClick={handleCreate}>
          <Plus/>
        </Button.Icon>
      </Panel.Header>

      <Panel.Body scroll={false}>
        <ScrollArea className="px-1.5 py-1.5 space-y-1" role="list" aria-label="Playlists">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlists.map((tree) => tree.playlist.id)} strategy={verticalListSortingStrategy}>
              {playlists.map((tree) => {
                const isSelected = tree.playlist.id === currentPlaylistId;
                const isEditing = tree.playlist.id === recentlyCreatedId || actions.isEditing('playlist', tree.playlist.id);

                function handleSelect() { setCurrentPlaylistId(tree.playlist.id); }
                function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handlePlaylistContextMenu(event, tree.playlist.id); }
                function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
                  event.stopPropagation();
                  actions.openPlaylistMenuFromButton(tree.playlist.id, event.currentTarget);
                }
                function handleRename(name: string) {
                  void renamePlaylist(tree.playlist.id, name);
                  clearRecentlyCreated();
                  actions.clearEditing();
                }

                return (
                  <PlaylistRow
                    key={tree.playlist.id}
                    id={tree.playlist.id}
                    name={tree.playlist.name}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    onSelect={handleSelect}
                    onContextMenu={handleContextMenu}
                    onMenuClick={handleMenuButtonClick}
                    onRename={handleRename}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </Panel.Body>
    </Panel>
  );
}

interface PlaylistRowProps {
  id: string;
  name: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRename: (name: string) => void;
}

function PlaylistRow({ id, name, isSelected, isEditing, onSelect, onContextMenu, onMenuClick, onRename }: PlaylistRowProps) {
  const activeRef = useScrollAreaActiveItem(isSelected);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const setRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    activeRef.current = el;
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setRef} style={style} className="group relative" {...attributes} {...listeners} role="listitem">
      <Button
        variant="ghost"
        active={isSelected}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        className="block w-full rounded-sm border-0 px-2 py-1.5 pr-7 text-left text-md hover:bg-quaternary/50 hover:text-primary"
      >
        <span className="flex items-center gap-2">
          <List className="shrink-0 text-tertiary" size={14} strokeWidth={1.75} />
          <EditableField
            value={name}
            onCommit={onRename}
            editing={isEditing}
            className="text-md"
          />
        </span>
      </Button>

      <Button.Icon label={`Open ${name} menu`} onPointerDown={(event) => event.stopPropagation()} onClick={onMenuClick} variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" >
        <EllipsisVertical />
      </Button.Icon>
    </div>
  );
}
