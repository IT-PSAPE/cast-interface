import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isLyricPresentation } from '@core/presentation-entities';
import type { Id, LibraryPlaylistBundle, PlaylistTree, Presentation } from '@core/types';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';

type PresentationBrowseSource = 'playlist' | 'project';

interface NavigationStateValue {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  currentPresentationId: Id | null;
  currentPlaylistPresentationId: Id | null;
  currentDrawerPresentationId: Id | null;
  currentOutputPresentationId: Id | null;
  currentLibraryBundle: LibraryPlaylistBundle | null;
  currentPresentation: Presentation | null;
  currentPlaylistPresentation: Presentation | null;
  isDetachedPresentationBrowser: boolean;
  outputArmVersion: number;
  slideCountByPresentation: Map<Id, number>;
  recentlyCreatedId: Id | null;
}

interface NavigationActionsValue {
  selectLibrary: (id: Id) => void;
  selectPlaylistPresentation: (id: Id) => void;
  browsePresentation: (id: Id) => void;
  armOutputPresentation: (id: Id) => void;
  clearOutputPresentation: () => void;
  setCurrentPlaylistId: (id: Id | null) => void;
  clearRecentlyCreated: () => void;
  createLibrary: () => Promise<void>;
  createPlaylist: () => Promise<void>;
  createPresentation: () => Promise<void>;
  createLyric: () => Promise<void>;
  createSegment: () => Promise<void>;
  addPresentationToSegment: (segmentId: Id) => Promise<void>;
  moveCurrentPresentationToSegment: (segmentId: Id | null) => Promise<void>;
  renameLibrary: (id: Id, name: string) => Promise<void>;
  renamePlaylist: (id: Id, name: string) => Promise<void>;
  renamePresentation: (id: Id, title: string) => Promise<void>;
}

type NavigationContextValue = NavigationStateValue & NavigationActionsValue;

const NavigationStateContext = createContext<NavigationStateValue | null>(null);
const NavigationActionsContext = createContext<NavigationActionsValue | null>(null);

export function resolveCurrentPresentationId(currentPresentationId: Id | null, presentationIds: Iterable<Id>): Id | null {
  if (!currentPresentationId) return null;
  for (const presentationId of presentationIds) {
    if (presentationId === currentPresentationId) return currentPresentationId;
  }
  return null;
}

export function resolveCurrentPlaylistPresentationId(currentPresentationId: Id | null, selectedTree: PlaylistTree | null): Id | null {
  const presentationIds = extractPlaylistPresentationIds(selectedTree);
  if (!currentPresentationId) return null;
  if (presentationIds.includes(currentPresentationId)) return currentPresentationId;
  return null;
}

export function resolvePinnedLyricPresentationId(
  currentPresentationId: Id | null,
  selectedTree: PlaylistTree | null,
  presentationsById: ReadonlyMap<Id, Presentation>,
): Id | null {
  if (currentPresentationId && isLyricPresentation(presentationsById.get(currentPresentationId) ?? null)) {
    return resolveCurrentPresentationId(currentPresentationId, presentationsById.keys());
  }

  return resolveCurrentPlaylistPresentationId(currentPresentationId, selectedTree);
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { snapshot, mutate, setStatusText } = useCast();
  const { presentations, slides, presentationsById } = useProjectContent();

  const [currentLibraryId, setCurrentLibraryId] = useState<Id | null>(null);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<Id | null>(null);
  const [currentPlaylistPresentationId, setCurrentPlaylistPresentationId] = useState<Id | null>(null);
  const [currentDrawerPresentationId, setCurrentDrawerPresentationId] = useState<Id | null>(null);
  const [currentOutputPresentationId, setCurrentOutputPresentationId] = useState<Id | null>(null);
  const [presentationBrowseSource, setPresentationBrowseSource] = useState<PresentationBrowseSource>('playlist');
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

    const nextDrawerPresentationId = resolveCurrentPresentationId(
      currentDrawerPresentationId,
      presentations.map((presentation) => presentation.id),
    );
    if (nextDrawerPresentationId !== currentDrawerPresentationId) {
      setCurrentDrawerPresentationId(nextDrawerPresentationId);
    }

    const nextPlaylistPresentationId = resolvePinnedLyricPresentationId(
      currentPlaylistPresentationId,
      selectedTree,
      presentationsById,
    );
    if (nextPlaylistPresentationId !== currentPlaylistPresentationId) {
      setCurrentPlaylistPresentationId(nextPlaylistPresentationId);
    }

    if (currentOutputPresentationId !== null) {
      const nextOutputPresentationId = resolvePinnedLyricPresentationId(
        currentOutputPresentationId,
        selectedTree,
        presentationsById,
      );
      if (nextOutputPresentationId !== currentOutputPresentationId) {
        setCurrentOutputPresentationId(nextOutputPresentationId);
      }
    }

    if (presentationBrowseSource === 'project' && nextDrawerPresentationId === null) {
      setPresentationBrowseSource('playlist');
    }
  }, [
    currentDrawerPresentationId,
    currentLibraryId,
    currentOutputPresentationId,
    currentPlaylistId,
    currentPlaylistPresentationId,
    presentationBrowseSource,
    presentations,
    presentationsById,
    snapshot,
  ]);

  const currentPresentationId = useMemo(() => {
    if (presentationBrowseSource === 'project') return currentDrawerPresentationId;
    return currentPlaylistPresentationId;
  }, [currentDrawerPresentationId, currentPlaylistPresentationId, presentationBrowseSource]);

  const currentLibraryBundle = useMemo<LibraryPlaylistBundle | null>(() => {
    if (!snapshot || !currentLibraryId) return null;
    return snapshot.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId) ?? null;
  }, [currentLibraryId, snapshot]);

  const currentPresentation = useMemo(
    () => (currentPresentationId ? presentationsById.get(currentPresentationId) ?? null : null),
    [currentPresentationId, presentationsById],
  );

  const currentPlaylistPresentation = useMemo(
    () => (currentPlaylistPresentationId ? presentationsById.get(currentPlaylistPresentationId) ?? null : null),
    [currentPlaylistPresentationId, presentationsById],
  );

  const slideCountByPresentation = useMemo(() => {
    const counts = new Map<Id, number>();
    for (const slide of slides) {
      counts.set(slide.presentationId, (counts.get(slide.presentationId) ?? 0) + 1);
    }
    return counts;
  }, [slides]);

  const clearRecentlyCreated = useCallback(() => {
    setRecentlyCreatedId(null);
  }, []);

  const clearPresentationBrowser = useCallback(() => {
    setCurrentPlaylistPresentationId(null);
    setCurrentDrawerPresentationId(null);
    setPresentationBrowseSource('playlist');
  }, []);

  function findNewId(previousIds: Set<Id>, currentIds: Id[]): Id | null {
    for (const id of currentIds) {
      if (!previousIds.has(id)) return id;
    }
    return null;
  }

  const selectLibrary = useCallback((libraryId: Id) => {
    if (!snapshot) return;
    const bundle = snapshot.libraryBundles.find((entry) => entry.library.id === libraryId);
    if (!bundle) return;
    if (libraryId !== currentLibraryId) {
      clearPresentationBrowser();
    }
    setCurrentLibraryId(libraryId);
    setCurrentPlaylistIdState(bundle.playlists[0]?.playlist.id ?? null);
    setStatusText(`Switched to ${bundle.library.name}`);
  }, [clearPresentationBrowser, currentLibraryId, setStatusText, snapshot]);

  const setCurrentPlaylistId = useCallback((playlistId: Id | null) => {
    if (playlistId !== currentPlaylistId) {
      clearPresentationBrowser();
    }
    setCurrentPlaylistIdState(playlistId);
  }, [clearPresentationBrowser, currentPlaylistId]);

  const selectPlaylistPresentation = useCallback((presentationId: Id) => {
    setCurrentPlaylistPresentationId(presentationId);
    setPresentationBrowseSource('playlist');
    setStatusText('Opened item');
  }, [setStatusText]);

  const browsePresentation = useCallback((presentationId: Id) => {
    setCurrentDrawerPresentationId(presentationId);
    setPresentationBrowseSource('project');
    setStatusText('Browsing item');
  }, [setStatusText]);

  const armOutputPresentation = useCallback((presentationId: Id) => {
    setCurrentOutputPresentationId(presentationId);
    setOutputArmVersion((current) => current + 1);
  }, []);

  const clearOutputPresentation = useCallback(() => {
    setCurrentOutputPresentationId(null);
  }, []);

  const createLibrary = useCallback(async () => {
    const previousIds = new Set(snapshot?.libraries.map((library) => library.id) ?? []);
    const next = await mutate(() => window.castApi.createLibrary('New Library'));
    setStatusText('Created library');
    const createdId = findNewId(previousIds, next.libraries.map((library) => library.id));
    if (createdId) setRecentlyCreatedId(createdId);
  }, [mutate, setStatusText, snapshot]);

  const createPlaylist = useCallback(async () => {
    if (!currentLibraryId) return;
    const previousIds = new Set(currentLibraryBundle?.playlists.map((tree) => tree.playlist.id) ?? []);
    const next = await mutate(() => window.castApi.createPlaylist(currentLibraryId, 'New Playlist'));
    setStatusText('Created playlist');
    const updatedBundle = next.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId);
    const createdId = findNewId(previousIds, updatedBundle?.playlists.map((tree) => tree.playlist.id) ?? []);
    if (createdId) {
      setCurrentPlaylistId(createdId);
      setRecentlyCreatedId(createdId);
    }
  }, [currentLibraryBundle, currentLibraryId, mutate, setCurrentPlaylistId, setStatusText]);

  const createPresentation = useCallback(async () => {
    const previousIds = new Set(presentations.map((presentation) => presentation.id));
    const next = await mutate(() => window.castApi.createPresentation('New Presentation'));
    const createdId = findNewId(previousIds, next.presentations.map((presentation) => presentation.id));
    if (!createdId) return;
    await mutate(() => window.castApi.createSlide({ presentationId: createdId }));
    setCurrentDrawerPresentationId(createdId);
    setPresentationBrowseSource('project');
    setRecentlyCreatedId(createdId);
    setStatusText('Created presentation');
  }, [mutate, presentations, setStatusText]);

  const createLyric = useCallback(async () => {
    const previousIds = new Set(presentations.map((presentation) => presentation.id));
    const next = await mutate(() => window.castApi.createLyric('New Lyric'));
    const createdId = findNewId(previousIds, next.presentations.map((presentation) => presentation.id));
    if (!createdId) return;
    await mutate(() => window.castApi.createSlide({ presentationId: createdId }));
    setCurrentDrawerPresentationId(createdId);
    setPresentationBrowseSource('project');
    setRecentlyCreatedId(createdId);
    setStatusText('Created lyric');
  }, [mutate, presentations, setStatusText]);

  const createSegment = useCallback(async () => {
    if (!currentPlaylistId) return;
    const currentTree = currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId);
    const previousIds = new Set(currentTree?.segments.map((segment) => segment.segment.id) ?? []);
    const next = await mutate(() => window.castApi.createPlaylistSegment(currentPlaylistId, 'New Segment'));
    setStatusText('Created segment');
    const updatedBundle = next.libraryBundles.find((bundle) => bundle.library.id === currentLibraryId);
    const updatedTree = updatedBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId);
    const createdId = findNewId(previousIds, updatedTree?.segments.map((segment) => segment.segment.id) ?? []);
    if (createdId) setRecentlyCreatedId(createdId);
  }, [currentLibraryBundle, currentLibraryId, currentPlaylistId, mutate, setStatusText]);

  const addPresentationToSegment = useCallback(async (segmentId: Id) => {
    if (!currentPresentationId || !currentPlaylistId) return;
    await mutate(() => window.castApi.addPresentationToSegment(segmentId, currentPresentationId));
    setStatusText('Moved item to segment');
  }, [currentPlaylistId, currentPresentationId, mutate, setStatusText]);

  const moveCurrentPresentationToSegment = useCallback(async (segmentId: Id | null) => {
    if (!currentPresentationId || !currentPlaylistId) return;
    await mutate(() => window.castApi.movePresentationToSegment(currentPlaylistId, currentPresentationId, segmentId));
    setStatusText(segmentId ? 'Moved item to segment' : 'Removed item from playlist');
  }, [currentPlaylistId, currentPresentationId, mutate, setStatusText]);

  const renameLibrary = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renameLibrary(id, name));
    setStatusText(`Renamed library: ${name}`);
  }, [mutate, setStatusText]);

  const renamePlaylist = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renamePlaylist(id, name));
    setStatusText(`Renamed playlist: ${name}`);
  }, [mutate, setStatusText]);

  const renamePresentation = useCallback(async (id: Id, title: string) => {
    await mutate(() => window.castApi.renamePresentation(id, title));
    setStatusText(`Renamed item: ${title}`);
  }, [mutate, setStatusText]);

  const stateValue = useMemo<NavigationStateValue>(() => ({
    currentLibraryId,
    currentPlaylistId,
    currentPresentationId,
    currentPlaylistPresentationId,
    currentDrawerPresentationId,
    currentOutputPresentationId,
    currentLibraryBundle,
    currentPresentation,
    currentPlaylistPresentation,
    isDetachedPresentationBrowser: presentationBrowseSource === 'project',
    outputArmVersion,
    slideCountByPresentation,
    recentlyCreatedId,
  }), [
    currentDrawerPresentationId,
    currentLibraryBundle,
    currentLibraryId,
    currentOutputPresentationId,
    currentPlaylistId,
    currentPlaylistPresentation,
    currentPlaylistPresentationId,
    currentPresentation,
    currentPresentationId,
    outputArmVersion,
    presentationBrowseSource,
    recentlyCreatedId,
    slideCountByPresentation,
  ]);

  const actionsValue = useMemo<NavigationActionsValue>(() => ({
    selectLibrary,
    selectPlaylistPresentation,
    browsePresentation,
    armOutputPresentation,
    clearOutputPresentation,
    setCurrentPlaylistId,
    clearRecentlyCreated,
    createLibrary,
    createPlaylist,
    createPresentation,
    createLyric,
    createSegment,
    addPresentationToSegment,
    moveCurrentPresentationToSegment,
    renameLibrary,
    renamePlaylist,
    renamePresentation,
  }), [
    addPresentationToSegment,
    armOutputPresentation,
    browsePresentation,
    clearOutputPresentation,
    clearRecentlyCreated,
    createLibrary,
    createLyric,
    createPlaylist,
    createPresentation,
    createSegment,
    moveCurrentPresentationToSegment,
    renameLibrary,
    renamePlaylist,
    renamePresentation,
    selectLibrary,
    setCurrentPlaylistId,
    selectPlaylistPresentation,
  ]);

  return (
    <NavigationStateContext.Provider value={stateValue}>
      <NavigationActionsContext.Provider value={actionsValue}>
        {children}
      </NavigationActionsContext.Provider>
    </NavigationStateContext.Provider>
  );
}

function extractPlaylistPresentationIds(selectedTree: PlaylistTree | null): Id[] {
  if (!selectedTree) return [];

  const presentationIds: Id[] = [];
  for (const segment of selectedTree.segments) {
    for (const entry of segment.entries) {
      presentationIds.push(entry.presentation.id);
    }
  }

  return presentationIds;
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
