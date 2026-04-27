import { Folder, LayoutGrid, ListMusic, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Id, LibraryPlaylistBundle, Playlist, Library } from '@core/types';
import { Dialog } from '@renderer/components/overlays/dialog';
import { useCast } from '@renderer/contexts/app-context';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { useWorkbench } from '@renderer/contexts/workbench-context';
import { useProjectContent } from '@renderer/contexts/use-project-content';
import { cn } from '@renderer/utils/cn';
import { useCommandPalette } from './command-palette-context';

interface ResultItem {
  id: string;
  kind: 'library' | 'playlist' | 'deckItem';
  label: string;
  subtitle?: string;
  icon: ReactNode;
  onSelect: () => void;
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { snapshot } = useCast();
  const { deckItems } = useProjectContent();
  const navigation = useNavigation();
  const { actions: workbenchActions } = useWorkbench();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    queueMicrotask(() => {
      inputRef.current?.focus();
    });
  }, [isOpen]);

  const results = useMemo<ResultItem[]>(() => {
    if (!snapshot) return [];

    const libraryById = new Map<Id, Library>(snapshot.libraries.map((library) => [library.id, library]));

    const all: ResultItem[] = [
      ...snapshot.libraries.map((library) => ({
        id: `library:${library.id}`,
        kind: 'library' as const,
        label: library.name,
        subtitle: 'Library',
        icon: <Folder size={16} />,
        onSelect: () => {
          navigation.selectLibrary(library.id);
          workbenchActions.setWorkbenchMode('show');
        },
      })),
      ...flattenPlaylists(snapshot.libraryBundles).map(({ playlist, library }) => ({
        id: `playlist:${playlist.id}`,
        kind: 'playlist' as const,
        label: playlist.name,
        subtitle: `Playlist · ${library.name}`,
        icon: <ListMusic size={16} />,
        onSelect: () => {
          navigation.selectLibrary(library.id);
          navigation.setCurrentPlaylistId(playlist.id);
          workbenchActions.setWorkbenchMode('show');
        },
      })),
      ...deckItems.map((item) => ({
        id: `deckItem:${item.id}`,
        kind: 'deckItem' as const,
        label: item.title,
        subtitle: item.type === 'lyric' ? 'Lyric' : 'Presentation',
        icon: <LayoutGrid size={16} />,
        onSelect: () => {
          navigation.browseDeckItem(item.id);
          workbenchActions.setWorkbenchMode('deck-editor');
        },
      })),
    ];

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return all.slice(0, 30);
    }

    return all
      .map((item) => ({ item, score: scoreMatch(item, trimmed) }))
      .filter((scored) => scored.score > 0)
      .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label))
      .map(({ item }) => item)
      .slice(0, 30);

    function flattenPlaylists(bundles: LibraryPlaylistBundle[]): Array<{ playlist: Playlist; library: Library }> {
      const out: Array<{ playlist: Playlist; library: Library }> = [];
      for (const bundle of bundles) {
        for (const tree of bundle.playlists) {
          const library = libraryById.get(tree.playlist.libraryId);
          if (!library) continue;
          out.push({ playlist: tree.playlist, library });
        }
      }
      return out;
    }
  }, [snapshot, deckItems, query, navigation, workbenchActions]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(0);
  }, [results, activeIndex]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (results.length === 0 ? 0 : (prev - 1 + results.length) % results.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[activeIndex];
      if (!target) return;
      target.onSelect();
      close();
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(next) => { if (!next) close(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner className="items-start pt-[15vh]">
          <Dialog.Content className="w-full max-w-xl">
            <div className="flex items-center gap-2 border-b border-primary px-4 py-3">
              <Search size={16} className="text-secondary shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Jump to a library, playlist, or deck…"
                className="w-full bg-transparent text-sm text-primary placeholder:text-tertiary outline-none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <Dialog.Body className="overflow-y-auto px-1 py-1 max-h-[50vh]">
              {results.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-secondary">
                  {snapshot ? 'No matches' : 'Loading…'}
                </div>
              ) : (
                <ul role="listbox" className="flex flex-col">
                  {results.map((item, index) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => { item.onSelect(); close(); }}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                          index === activeIndex ? 'bg-secondary text-primary' : 'text-primary',
                        )}
                      >
                        <span className="text-secondary shrink-0">{item.icon}</span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.subtitle && (
                          <span className="text-xs text-tertiary shrink-0">{item.subtitle}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function scoreMatch(item: ResultItem, query: string): number {
  const haystack = `${item.label} ${item.subtitle ?? ''}`.toLowerCase();
  const labelLower = item.label.toLowerCase();
  if (labelLower === query) return 1000;
  if (labelLower.startsWith(query)) return 500;
  if (labelLower.includes(query)) return 100;
  if (haystack.includes(query)) return 10;
  return 0;
}
