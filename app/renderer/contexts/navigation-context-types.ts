import type { ContentItem, Id, LibraryPlaylistBundle } from '@core/types';

export interface NavigationStateValue {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  currentContentItemId: Id | null;
  currentPlaylistContentItemId: Id | null;
  currentDrawerContentItemId: Id | null;
  currentOutputContentItemId: Id | null;
  currentLibraryBundle: LibraryPlaylistBundle | null;
  currentContentItem: ContentItem | null;
  currentPlaylistContentItem: ContentItem | null;
  isDetachedContentBrowser: boolean;
  outputArmVersion: number;
  slideCountByContentItem: Map<Id, number>;
  recentlyCreatedId: Id | null;
}

export interface NavigationActionsValue {
  selectLibrary: (id: Id) => void;
  selectPlaylistContentItem: (id: Id) => void;
  browseContentItem: (id: Id) => void;
  armOutputContentItem: (id: Id) => void;
  clearOutputContentItem: () => void;
  setCurrentPlaylistId: (id: Id | null) => void;
  clearRecentlyCreated: () => void;
  createLibrary: () => Promise<void>;
  createPlaylist: () => Promise<void>;
  createDeck: () => Promise<void>;
  createEmptyLyric: () => Promise<void>;
  createLyricFromText: (text: string) => Promise<void>;
  createSegment: () => Promise<void>;
  addContentItemToSegment: (segmentId: Id) => Promise<void>;
  moveCurrentContentItemToSegment: (segmentId: Id | null) => Promise<void>;
  renameLibrary: (id: Id, name: string) => Promise<void>;
  renamePlaylist: (id: Id, name: string) => Promise<void>;
  renameContentItem: (id: Id, title: string) => Promise<void>;
}

export type NavigationContextValue = NavigationStateValue & NavigationActionsValue;
