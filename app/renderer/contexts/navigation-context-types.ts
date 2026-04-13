import type { DeckItem, Id, LibraryPlaylistBundle } from '@core/types';

export interface NavigationStateValue {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  currentDeckItemId: Id | null;
  currentPlaylistDeckItemId: Id | null;
  currentDrawerDeckItemId: Id | null;
  currentOutputDeckItemId: Id | null;
  currentLibraryBundle: LibraryPlaylistBundle | null;
  currentDeckItem: DeckItem | null;
  currentPlaylistDeckItem: DeckItem | null;
  isDetachedDeckBrowser: boolean;
  outputArmVersion: number;
  slideCountByDeckItem: Map<Id, number>;
  recentlyCreatedId: Id | null;
}

export interface NavigationActionsValue {
  selectLibrary: (id: Id) => void;
  selectPlaylistDeckItem: (id: Id) => void;
  browseDeckItem: (id: Id) => void;
  armOutputDeckItem: (id: Id) => void;
  clearOutputDeckItem: () => void;
  setCurrentPlaylistId: (id: Id | null) => void;
  clearRecentlyCreated: () => void;
  createLibrary: () => Promise<void>;
  createPlaylist: () => Promise<void>;
  createPresentation: () => Promise<void>;
  createEmptyLyric: () => Promise<void>;
  createSegment: () => Promise<void>;
  addDeckItemToSegment: (segmentId: Id) => Promise<void>;
  moveCurrentDeckItemToSegment: (segmentId: Id | null) => Promise<void>;
  renameLibrary: (id: Id, name: string) => Promise<void>;
  renamePlaylist: (id: Id, name: string) => Promise<void>;
  renameDeckItem: (id: Id, title: string) => Promise<void>;
}

export type NavigationContextValue = NavigationStateValue & NavigationActionsValue;
