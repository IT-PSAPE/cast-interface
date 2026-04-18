import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSlideDeckItemId } from '@core/deck-items';
import type { Id, LibraryPlaylistBundle } from '@core/types';
import { useCast } from './app-context';
import { useProjectContent } from './use-project-content';
import type { NavigationActionsValue, NavigationContextValue, NavigationStateValue } from './navigation-context-types';
import { findCreatedId, findFirstPlaylistEntryByDeckItemId, findPlaylistEntryById, resolveCurrentDeckItemId, resolveCurrentPlaylistEntryId, resolvePinnedLyricDeckItemId } from './navigation-context-utils';

type ContentBrowseSource = 'playlist' | 'project';

const NavigationStateContext = createContext<NavigationStateValue | null>(null);
const NavigationActionsContext = createContext<NavigationActionsValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { snapshot, mutate, runOperation, setStatusText } = useCast();
  const { deckItems, deckItemsById, slides } = useProjectContent();

  const [currentLibraryId, setCurrentLibraryId] = useState<Id | null>(null);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<Id | null>(null);
  const [currentPlaylistEntryId, setCurrentPlaylistEntryId] = useState<Id | null>(null);
  const [currentPlaylistDeckItemId, setCurrentPlaylistDeckItemId] = useState<Id | null>(null);
  const [currentDrawerDeckItemId, setCurrentDrawerDeckItemId] = useState<Id | null>(null);
  const [currentOutputPlaylistEntryId, setCurrentOutputPlaylistEntryId] = useState<Id | null>(null);
  const [currentOutputDeckItemId, setCurrentOutputDeckItemId] = useState<Id | null>(null);
  const [deckBrowseSource, setContentBrowseSource] = useState<ContentBrowseSource>('playlist');
  const [outputArmVersion, setOutputArmVersion] = useState(0);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<Id | null>(null);

  useEffect(() => {
    if (!snapshot || snapshot.libraries.length === 0) return;
    if (!currentLibraryId || !snapshot.libraries.some((library) => library.id === currentLibraryId)) {
      setCurrentLibraryId(snapshot.libraries[0].id);
      return;
    }

    const bundle = snapshot.libraryBundles.find((entry) => entry.library.id === currentLibraryId);
    if (!bundle) return;

    const nextPlaylistId = (!currentPlaylistId || !bundle.playlists.some((tree) => tree.playlist.id === currentPlaylistId))
      ? bundle.playlists[0]?.playlist.id ?? null
      : currentPlaylistId;
    if (nextPlaylistId !== currentPlaylistId) {
      setCurrentPlaylistIdState(nextPlaylistId);
    }

    const selectedTree = nextPlaylistId
      ? bundle.playlists.find((tree) => tree.playlist.id === nextPlaylistId) ?? null
      : null;

    const nextDrawerDeckItemId = resolveCurrentDeckItemId(
      currentDrawerDeckItemId,
      deckItems.map((item) => item.id),
    );
    if (nextDrawerDeckItemId !== currentDrawerDeckItemId) {
      setCurrentDrawerDeckItemId(nextDrawerDeckItemId);
    }

    const nextPlaylistDeckItemId = resolvePinnedLyricDeckItemId(
      currentPlaylistDeckItemId,
      selectedTree,
      deckItemsById,
    );
    const nextPlaylistEntryId = resolveCurrentPlaylistEntryId(
      currentPlaylistEntryId,
      selectedTree,
      nextPlaylistDeckItemId,
    );
    if (nextPlaylistEntryId !== currentPlaylistEntryId) {
      setCurrentPlaylistEntryId(nextPlaylistEntryId);
    }
    if (nextPlaylistDeckItemId !== currentPlaylistDeckItemId) {
      setCurrentPlaylistDeckItemId(nextPlaylistDeckItemId);
    }

    if (currentOutputDeckItemId !== null) {
      const nextOutputDeckItemId = resolvePinnedLyricDeckItemId(
        currentOutputDeckItemId,
        selectedTree,
        deckItemsById,
      );
      if (nextOutputDeckItemId !== currentOutputDeckItemId) {
        setCurrentOutputDeckItemId(nextOutputDeckItemId);
      }
      const nextOutputEntryId = resolveCurrentPlaylistEntryId(
        currentOutputPlaylistEntryId,
        selectedTree,
        nextOutputDeckItemId,
      );
      if (nextOutputEntryId !== currentOutputPlaylistEntryId) {
        setCurrentOutputPlaylistEntryId(nextOutputEntryId);
      }
    } else if (currentOutputPlaylistEntryId !== null) {
      setCurrentOutputPlaylistEntryId(null);
    }

    if (deckBrowseSource === 'project' && nextDrawerDeckItemId === null) {
      setContentBrowseSource('playlist');
    }
  }, [
    deckBrowseSource,
    deckItems,
    deckItemsById,
    currentDrawerDeckItemId,
    currentLibraryId,
    currentOutputPlaylistEntryId,
    currentOutputDeckItemId,
    currentPlaylistEntryId,
    currentPlaylistDeckItemId,
    currentPlaylistId,
    snapshot,
  ]);

  const currentDeckItemId = useMemo(() => (
    deckBrowseSource === 'project' ? currentDrawerDeckItemId : currentPlaylistDeckItemId
  ), [deckBrowseSource, currentDrawerDeckItemId, currentPlaylistDeckItemId]);

  const currentLibraryBundle = useMemo<LibraryPlaylistBundle | null>(
    () => (!snapshot || !currentLibraryId ? null : snapshot.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId) ?? null),
    [currentLibraryId, snapshot],
  );

  const currentDeckItem = useMemo(
    () => (currentDeckItemId ? deckItemsById.get(currentDeckItemId) ?? null : null),
    [deckItemsById, currentDeckItemId],
  );

  const currentPlaylistDeckItem = useMemo(
    () => (currentPlaylistDeckItemId ? deckItemsById.get(currentPlaylistDeckItemId) ?? null : null),
    [deckItemsById, currentPlaylistDeckItemId],
  );

  const slideCountByDeckItem = useMemo(() => {
    const counts = new Map<Id, number>();
    for (const slide of slides) {
      const itemId = getSlideDeckItemId(slide);
      if (!itemId) continue;
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
    return counts;
  }, [slides]);

  const clearRecentlyCreated = useCallback(() => { setRecentlyCreatedId(null); }, []);

  const clearContentBrowser = useCallback(() => {
    setCurrentPlaylistEntryId(null);
    setCurrentPlaylistDeckItemId(null);
    setCurrentDrawerDeckItemId(null);
    setCurrentOutputPlaylistEntryId(null);
    setCurrentOutputDeckItemId(null);
    setContentBrowseSource('playlist');
  }, []);

  const selectLibrary = useCallback((libraryId: Id) => {
    if (!snapshot) return;
    const bundle = snapshot.libraryBundles.find((entry) => entry.library.id === libraryId);
    if (!bundle) return;
    if (libraryId !== currentLibraryId) {
      clearContentBrowser();
    }
    setCurrentLibraryId(libraryId);
    setCurrentPlaylistIdState(bundle.playlists[0]?.playlist.id ?? null);
    setStatusText(`Switched to ${bundle.library.name}`);
  }, [clearContentBrowser, currentLibraryId, setStatusText, snapshot]);

  const setCurrentPlaylistId = useCallback((playlistId: Id | null) => {
    if (playlistId !== currentPlaylistId) {
      clearContentBrowser();
    }
    setCurrentPlaylistIdState(playlistId);
  }, [clearContentBrowser, currentPlaylistId]);

  const selectPlaylistEntry = useCallback((entryId: Id) => {
    const entry = findPlaylistEntryById(
      currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      entryId,
    );
    if (!entry) return;
    setCurrentPlaylistEntryId(entry.entryId);
    setCurrentPlaylistDeckItemId(entry.itemId);
    setContentBrowseSource('playlist');
    setStatusText('Opened item');
  }, [currentLibraryBundle, currentPlaylistId, setStatusText]);

  const selectPlaylistDeckItem = useCallback((itemId: Id) => {
    const entry = findFirstPlaylistEntryByDeckItemId(
      currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      itemId,
    );
    setCurrentPlaylistEntryId(entry?.entryId ?? null);
    setCurrentPlaylistDeckItemId(itemId);
    setContentBrowseSource('playlist');
    setStatusText('Opened item');
  }, [currentLibraryBundle, currentPlaylistId, setStatusText]);

  const browseDeckItem = useCallback((itemId: Id) => {
    setCurrentDrawerDeckItemId(itemId);
    setContentBrowseSource('project');
    setStatusText('Browsing item');
  }, [setStatusText]);

  const armOutputDeckItem = useCallback((itemId: Id) => {
    const entry = findFirstPlaylistEntryByDeckItemId(
      currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      itemId,
    );
    setCurrentOutputPlaylistEntryId(entry?.entryId ?? null);
    setCurrentOutputDeckItemId(itemId);
    setOutputArmVersion((current) => current + 1);
  }, [currentLibraryBundle, currentPlaylistId]);

  const armOutputPlaylistEntry = useCallback((entryId: Id) => {
    const entry = findPlaylistEntryById(
      currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      entryId,
    );
    if (!entry) return;
    setCurrentOutputPlaylistEntryId(entry.entryId);
    setCurrentOutputDeckItemId(entry.itemId);
    setOutputArmVersion((current) => current + 1);
  }, [currentLibraryBundle, currentPlaylistId]);

  const clearOutputDeckItem = useCallback(() => {
    setCurrentOutputPlaylistEntryId(null);
    setCurrentOutputDeckItemId(null);
  }, []);

  const createLibrary = useCallback(async () => {
    const previousIds = new Set(snapshot?.libraries.map((library) => library.id) ?? []);
    const next = await mutate(() => window.castApi.createLibrary('New Library'));
    setStatusText('Created library');
    const createdId = findCreatedId(previousIds, next.libraries.map((library) => library.id));
    if (createdId) setRecentlyCreatedId(createdId);
  }, [mutate, setStatusText, snapshot]);

  const createPlaylist = useCallback(async () => {
    if (!currentLibraryId) return;
    const previousIds = new Set(currentLibraryBundle?.playlists.map((tree) => tree.playlist.id) ?? []);
    const next = await mutate(() => window.castApi.createPlaylist(currentLibraryId, 'New Playlist'));
    setStatusText('Created playlist');
    const updatedBundle = next.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId);
    const createdId = findCreatedId(previousIds, updatedBundle?.playlists.map((tree) => tree.playlist.id) ?? []);
    if (createdId) {
      setCurrentPlaylistId(createdId);
      setRecentlyCreatedId(createdId);
    }
  }, [currentLibraryBundle, currentLibraryId, mutate, setCurrentPlaylistId, setStatusText]);

  const createPresentation = useCallback(async () => {
    await runOperation('Creating deck...', async () => {
      const previousIds = new Set(deckItems.map((item) => item.id));
      const next = await mutate(() => window.castApi.createPresentation('New Presentation'));
      const createdId = findCreatedId(previousIds, [...next.presentations, ...next.lyrics].map((item) => item.id));
      if (!createdId) return;
      await mutate(() => window.castApi.createSlide({ presentationId: createdId }));
      setCurrentDrawerDeckItemId(createdId);
      setContentBrowseSource('project');
      setRecentlyCreatedId(createdId);
      setStatusText('Created deck');
    });
  }, [deckItems, mutate, runOperation, setStatusText]);

  const createEmptyLyric = useCallback(async () => {
    await runOperation('Creating lyric...', async () => {
      const previousIds = new Set(deckItems.map((item) => item.id));
      const next = await mutate(() => window.castApi.createLyric('New Lyric'));
      const createdId = findCreatedId(previousIds, [...next.presentations, ...next.lyrics].map((item) => item.id));
      if (!createdId) return;
      await mutate(() => window.castApi.createSlide({ lyricId: createdId }));
      setCurrentDrawerDeckItemId(createdId);
      setContentBrowseSource('project');
      setRecentlyCreatedId(createdId);
      setStatusText('Created lyric');
    });
  }, [deckItems, mutate, runOperation, setStatusText]);

  const createSegment = useCallback(async () => {
    if (!currentPlaylistId) return;
    const currentTree = currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId);
    const previousIds = new Set(currentTree?.segments.map((segment) => segment.segment.id) ?? []);
    const next = await mutate(() => window.castApi.createPlaylistSegment(currentPlaylistId, 'New Segment'));
    setStatusText('Created segment');
    const updatedBundle = next.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId);
    const updatedTree = updatedBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId);
    const createdId = findCreatedId(previousIds, updatedTree?.segments.map((segment) => segment.segment.id) ?? []);
    if (createdId) setRecentlyCreatedId(createdId);
  }, [currentLibraryBundle, currentLibraryId, currentPlaylistId, mutate, setStatusText]);

  const addDeckItemToSegment = useCallback(async (segmentId: Id) => {
    if (!currentDeckItemId || !currentPlaylistId) return;
    await mutate(() => window.castApi.addDeckItemToSegment(segmentId, currentDeckItemId));
    setStatusText('Added item to segment');
  }, [currentDeckItemId, currentPlaylistId, mutate, setStatusText]);

  const moveCurrentDeckItemToSegment = useCallback(async (segmentId: Id | null) => {
    if (!currentDeckItemId || !currentPlaylistId) return;
    await mutate(() => window.castApi.moveDeckItemToSegment(currentPlaylistId, currentDeckItemId, segmentId));
    setStatusText(segmentId ? 'Moved item to segment' : 'Removed item from playlist');
  }, [currentDeckItemId, currentPlaylistId, mutate, setStatusText]);

  const renameLibrary = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renameLibrary(id, name));
    setStatusText(`Renamed library: ${name}`);
  }, [mutate, setStatusText]);

  const renamePlaylist = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renamePlaylist(id, name));
    setStatusText(`Renamed playlist: ${name}`);
  }, [mutate, setStatusText]);

  const renameDeckItem = useCallback(async (id: Id, title: string) => {
    const item = deckItemsById.get(id);
    if (!item) return;
    if (item.type === 'presentation') {
      await mutate(() => window.castApi.renamePresentation(id, title));
    } else {
      await mutate(() => window.castApi.renameLyric(id, title));
    }
    setStatusText(`Renamed item: ${title}`);
  }, [deckItemsById, mutate, setStatusText]);

  const stateValue = useMemo<NavigationStateValue>(() => ({
    currentLibraryId,
    currentPlaylistId,
    currentPlaylistEntryId,
    currentDeckItemId,
    currentPlaylistDeckItemId,
    currentDrawerDeckItemId,
    currentOutputPlaylistEntryId,
    currentOutputDeckItemId,
    currentLibraryBundle,
    currentDeckItem,
    currentPlaylistDeckItem,
    isDetachedDeckBrowser: deckBrowseSource === 'project',
    outputArmVersion,
    slideCountByDeckItem,
    recentlyCreatedId,
  }), [
    deckBrowseSource,
    currentDeckItem,
    currentDeckItemId,
    currentDrawerDeckItemId,
    currentLibraryBundle,
    currentLibraryId,
    currentOutputPlaylistEntryId,
    currentOutputDeckItemId,
    currentPlaylistDeckItem,
    currentPlaylistEntryId,
    currentPlaylistDeckItemId,
    currentPlaylistId,
    outputArmVersion,
    recentlyCreatedId,
    slideCountByDeckItem,
  ]);

  const actionsValue = useMemo<NavigationActionsValue>(() => ({
    selectLibrary,
    selectPlaylistEntry,
    selectPlaylistDeckItem,
    browseDeckItem,
    armOutputPlaylistEntry,
    armOutputDeckItem,
    clearOutputDeckItem,
    setCurrentPlaylistId,
    clearRecentlyCreated,
    createLibrary,
    createPlaylist,
    createPresentation,
    createEmptyLyric,
    createSegment,
    addDeckItemToSegment,
    moveCurrentDeckItemToSegment,
    renameLibrary,
    renamePlaylist,
    renameDeckItem,
  }), [
    addDeckItemToSegment,
    armOutputPlaylistEntry,
    armOutputDeckItem,
    browseDeckItem,
    clearOutputDeckItem,
    clearRecentlyCreated,
    createPresentation,
    createEmptyLyric,
    createLibrary,
    createPlaylist,
    createSegment,
    moveCurrentDeckItemToSegment,
    renameDeckItem,
    renameLibrary,
    renamePlaylist,
    selectLibrary,
    selectPlaylistEntry,
    selectPlaylistDeckItem,
    setCurrentPlaylistId,
  ]);

  return (
    <NavigationStateContext.Provider value={stateValue}>
      <NavigationActionsContext.Provider value={actionsValue}>
        {children}
      </NavigationActionsContext.Provider>
    </NavigationStateContext.Provider>
  );
}

export function useNavigationState(): NavigationStateValue {
  const context = useContext(NavigationStateContext);
  if (!context) throw new Error('useNavigationState must be used within NavigationProvider');
  return context;
}
export function useNavigationActions(): NavigationActionsValue {
  const context = useContext(NavigationActionsContext);
  if (!context) throw new Error('useNavigationActions must be used within NavigationProvider');
  return context;
}
export function useNavigation(): NavigationContextValue {
  const state = useNavigationState();
  const actions = useNavigationActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
