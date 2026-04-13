import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSlideContentItemId } from '@core/content-items';
import type { Id, LibraryPlaylistBundle } from '@core/types';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';
import type { NavigationActionsValue, NavigationContextValue, NavigationStateValue } from './navigation-context-types';
import { findCreatedId, resolveCurrentContentItemId, resolveCurrentPlaylistContentItemId, resolvePinnedLyricContentItemId } from './navigation-context-utils';
import { createLyricSlidesFromText } from '../features/show/create-lyric-slides-from-text';

type ContentBrowseSource = 'playlist' | 'project';

const NavigationStateContext = createContext<NavigationStateValue | null>(null);
const NavigationActionsContext = createContext<NavigationActionsValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { snapshot, mutate, runOperation, setStatusText } = useCast();
  const { contentItems, contentItemsById, slides } = useProjectContent();

  const [currentLibraryId, setCurrentLibraryId] = useState<Id | null>(null);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<Id | null>(null);
  const [currentPlaylistContentItemId, setCurrentPlaylistContentItemId] = useState<Id | null>(null);
  const [currentDrawerContentItemId, setCurrentDrawerContentItemId] = useState<Id | null>(null);
  const [currentOutputContentItemId, setCurrentOutputContentItemId] = useState<Id | null>(null);
  const [contentBrowseSource, setContentBrowseSource] = useState<ContentBrowseSource>('playlist');
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

    const nextDrawerContentItemId = resolveCurrentContentItemId(
      currentDrawerContentItemId,
      contentItems.map((item) => item.id),
    );
    if (nextDrawerContentItemId !== currentDrawerContentItemId) {
      setCurrentDrawerContentItemId(nextDrawerContentItemId);
    }

    const nextPlaylistContentItemId = resolvePinnedLyricContentItemId(
      currentPlaylistContentItemId,
      selectedTree,
      contentItemsById,
    );
    if (nextPlaylistContentItemId !== currentPlaylistContentItemId) {
      setCurrentPlaylistContentItemId(nextPlaylistContentItemId);
    }

    if (currentOutputContentItemId !== null) {
      const nextOutputContentItemId = resolvePinnedLyricContentItemId(
        currentOutputContentItemId,
        selectedTree,
        contentItemsById,
      );
      if (nextOutputContentItemId !== currentOutputContentItemId) {
        setCurrentOutputContentItemId(nextOutputContentItemId);
      }
    }

    if (contentBrowseSource === 'project' && nextDrawerContentItemId === null) {
      setContentBrowseSource('playlist');
    }
  }, [
    contentBrowseSource,
    contentItems,
    contentItemsById,
    currentDrawerContentItemId,
    currentLibraryId,
    currentOutputContentItemId,
    currentPlaylistContentItemId,
    currentPlaylistId,
    snapshot,
  ]);

  const currentContentItemId = useMemo(() => (
    contentBrowseSource === 'project' ? currentDrawerContentItemId : currentPlaylistContentItemId
  ), [contentBrowseSource, currentDrawerContentItemId, currentPlaylistContentItemId]);

  const currentLibraryBundle = useMemo<LibraryPlaylistBundle | null>(
    () => (!snapshot || !currentLibraryId ? null : snapshot.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId) ?? null),
    [currentLibraryId, snapshot],
  );

  const currentContentItem = useMemo(
    () => (currentContentItemId ? contentItemsById.get(currentContentItemId) ?? null : null),
    [contentItemsById, currentContentItemId],
  );

  const currentPlaylistContentItem = useMemo(
    () => (currentPlaylistContentItemId ? contentItemsById.get(currentPlaylistContentItemId) ?? null : null),
    [contentItemsById, currentPlaylistContentItemId],
  );

  const slideCountByContentItem = useMemo(() => {
    const counts = new Map<Id, number>();
    for (const slide of slides) {
      const itemId = getSlideContentItemId(slide);
      if (!itemId) continue;
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
    return counts;
  }, [slides]);

  const clearRecentlyCreated = useCallback(() => { setRecentlyCreatedId(null); }, []);

  const clearContentBrowser = useCallback(() => {
    setCurrentPlaylistContentItemId(null);
    setCurrentDrawerContentItemId(null);
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

  const selectPlaylistContentItem = useCallback((itemId: Id) => {
    setCurrentPlaylistContentItemId(itemId);
    setContentBrowseSource('playlist');
    setStatusText('Opened item');
  }, [setStatusText]);

  const browseContentItem = useCallback((itemId: Id) => {
    setCurrentDrawerContentItemId(itemId);
    setContentBrowseSource('project');
    setStatusText('Browsing item');
  }, [setStatusText]);

  const armOutputContentItem = useCallback((itemId: Id) => {
    setCurrentOutputContentItemId(itemId);
    setOutputArmVersion((current) => current + 1);
  }, []);

  const clearOutputContentItem = useCallback(() => { setCurrentOutputContentItemId(null); }, []);

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

  const createDeck = useCallback(async () => {
    await runOperation('Creating deck...', async () => {
      const previousIds = new Set(contentItems.map((item) => item.id));
      const next = await mutate(() => window.castApi.createDeck('New Deck'));
      const createdId = findCreatedId(previousIds, [...next.decks, ...next.lyrics].map((item) => item.id));
      if (!createdId) return;
      await mutate(() => window.castApi.createSlide({ deckId: createdId }));
      setCurrentDrawerContentItemId(createdId);
      setContentBrowseSource('project');
      setRecentlyCreatedId(createdId);
      setStatusText('Created deck');
    });
  }, [contentItems, mutate, runOperation, setStatusText]);

  const createEmptyLyric = useCallback(async () => {
    await runOperation('Creating lyric...', async () => {
      const previousIds = new Set(contentItems.map((item) => item.id));
      const next = await mutate(() => window.castApi.createLyric('New Lyric'));
      const createdId = findCreatedId(previousIds, [...next.decks, ...next.lyrics].map((item) => item.id));
      if (!createdId) return;
      await mutate(() => window.castApi.createSlide({ lyricId: createdId }));
      setCurrentDrawerContentItemId(createdId);
      setContentBrowseSource('project');
      setRecentlyCreatedId(createdId);
      setStatusText('Created lyric');
    });
  }, [contentItems, mutate, runOperation, setStatusText]);

  const createLyricFromText = useCallback(async (text: string) => {
    await runOperation('Importing lyric text...', async () => {
      const previousIds = new Set(contentItems.map((item) => item.id));
      const next = await mutate(() => window.castApi.createLyric('New Lyric'));
      const createdId = findCreatedId(previousIds, [...next.decks, ...next.lyrics].map((item) => item.id));
      if (!createdId) return;
      await createLyricSlidesFromText({ lyricId: createdId, mutate, text });
      setCurrentDrawerContentItemId(createdId);
      setContentBrowseSource('project');
      setRecentlyCreatedId(createdId);
      setStatusText('Created lyric from text');
    });
  }, [contentItems, mutate, runOperation, setStatusText]);

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

  const addContentItemToSegment = useCallback(async (segmentId: Id) => {
    if (!currentContentItemId || !currentPlaylistId) return;
    await mutate(() => window.castApi.addContentItemToSegment(segmentId, currentContentItemId));
    setStatusText('Moved item to segment');
  }, [currentContentItemId, currentPlaylistId, mutate, setStatusText]);

  const moveCurrentContentItemToSegment = useCallback(async (segmentId: Id | null) => {
    if (!currentContentItemId || !currentPlaylistId) return;
    await mutate(() => window.castApi.moveContentItemToSegment(currentPlaylistId, currentContentItemId, segmentId));
    setStatusText(segmentId ? 'Moved item to segment' : 'Removed item from playlist');
  }, [currentContentItemId, currentPlaylistId, mutate, setStatusText]);

  const renameLibrary = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renameLibrary(id, name));
    setStatusText(`Renamed library: ${name}`);
  }, [mutate, setStatusText]);

  const renamePlaylist = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renamePlaylist(id, name));
    setStatusText(`Renamed playlist: ${name}`);
  }, [mutate, setStatusText]);

  const renameContentItem = useCallback(async (id: Id, title: string) => {
    const item = contentItemsById.get(id);
    if (!item) return;
    if (item.type === 'deck') {
      await mutate(() => window.castApi.renameDeck(id, title));
    } else {
      await mutate(() => window.castApi.renameLyric(id, title));
    }
    setStatusText(`Renamed item: ${title}`);
  }, [contentItemsById, mutate, setStatusText]);

  const stateValue = useMemo<NavigationStateValue>(() => ({
    currentLibraryId,
    currentPlaylistId,
    currentContentItemId,
    currentPlaylistContentItemId,
    currentDrawerContentItemId,
    currentOutputContentItemId,
    currentLibraryBundle,
    currentContentItem,
    currentPlaylistContentItem,
    isDetachedContentBrowser: contentBrowseSource === 'project',
    outputArmVersion,
    slideCountByContentItem,
    recentlyCreatedId,
  }), [
    contentBrowseSource,
    currentContentItem,
    currentContentItemId,
    currentDrawerContentItemId,
    currentLibraryBundle,
    currentLibraryId,
    currentOutputContentItemId,
    currentPlaylistContentItem,
    currentPlaylistContentItemId,
    currentPlaylistId,
    outputArmVersion,
    recentlyCreatedId,
    slideCountByContentItem,
  ]);

  const actionsValue = useMemo<NavigationActionsValue>(() => ({
    selectLibrary,
    selectPlaylistContentItem,
    browseContentItem,
    armOutputContentItem,
    clearOutputContentItem,
    setCurrentPlaylistId,
    clearRecentlyCreated,
    createLibrary,
    createPlaylist,
    createDeck,
    createEmptyLyric,
    createLyricFromText,
    createSegment,
    addContentItemToSegment,
    moveCurrentContentItemToSegment,
    renameLibrary,
    renamePlaylist,
    renameContentItem,
  }), [
    addContentItemToSegment,
    armOutputContentItem,
    browseContentItem,
    clearOutputContentItem,
    clearRecentlyCreated,
    createDeck,
    createEmptyLyric,
    createLibrary,
    createLyricFromText,
    createPlaylist,
    createSegment,
    moveCurrentContentItemToSegment,
    renameContentItem,
    renameLibrary,
    renamePlaylist,
    selectLibrary,
    selectPlaylistContentItem,
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
