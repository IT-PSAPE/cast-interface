import { useCallback, useSyncExternalStore } from 'react';

export type DeckBinSortKey = 'name' | 'created' | 'modified' | 'slides';
export type SortDirection = 'asc' | 'desc';
export interface DeckBinSort {
  key: DeckBinSortKey;
  direction: SortDirection;
}

const STORAGE_KEY = 'recast.deck-bin-sort';
const DEFAULT_SORT: DeckBinSort = { key: 'modified', direction: 'desc' };
const VALID_KEYS: DeckBinSortKey[] = ['name', 'created', 'modified', 'slides'];
const VALID_DIRECTIONS: SortDirection[] = ['asc', 'desc'];

function isValid(value: unknown): value is DeckBinSort {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return VALID_KEYS.includes(record.key as DeckBinSortKey)
    && VALID_DIRECTIONS.includes(record.direction as SortDirection);
}

function readFromStorage(): DeckBinSort {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SORT;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

let sortState: DeckBinSort = readFromStorage();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

export function useDeckBinSort() {
  const sort = useSyncExternalStore(subscribe, () => sortState, () => sortState);

  const setSort = useCallback((next: DeckBinSort) => {
    sortState = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors; in-memory state still updates
    }
    emit();
  }, []);

  return { sort, setSort };
}
