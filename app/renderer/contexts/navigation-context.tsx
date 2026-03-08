import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Id, LibraryPlaylistBundle, PlaylistTree, Presentation, PresentationKind } from '@core/types';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';

type PresentationBrowseSource = 'playlist' | 'project';

interface NavigationContextValue {
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
  createSegment: () => Promise<void>;
  addPresentationToSegment: (segmentId: Id) => Promise<void>;
  moveCurrentPresentationToSegment: (segmentId: Id | null) => Promise<void>;
  renameLibrary: (id: Id, name: string) => Promise<void>;
  renamePlaylist: (id: Id, name: string) => Promise<void>;
  renamePresentation: (id: Id, title: string) => Promise<void>;
  setPresentationKind: (id: Id, kind: PresentationKind) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function resolveCurrentPresentationId(currentPresentationId: Id | null, presentationIds: Iterable<Id>): Id | null {
  if (!currentPresentationId) return null;
  for (const presentationId of presentationIds) {
    if (presentationId === currentPresentationId) return currentPresentationId;
  }
  return null;
}

export function resolveCurrentPlaylistPresentationId(currentPresentationId: Id | null, selectedTree: PlaylistTree | null): Id | null {
  const presentationIds = extractPlaylistPresentationIds(selectedTree);
  if (presentationIds.length === 0) return null;
  if (currentPresentationId && presentationIds.includes(currentPresentationId)) return currentPresentationId;
  return presentationIds[0] ?? null;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { snapshot, mutate, setStatusText } = useCast();
  const { presentations, slides, presentationsById } = useProjectContent();

  const [currentLibraryId, setCurrentLibraryId] = useState<Id | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<Id | null>(null);
  const [currentPlaylistPresentationId, setCurrentPlaylistPresentationId] = useState<Id | null>(null);
  const [currentDrawerPresentationId, setCurrentDrawerPresentationId] = useState<Id | null>(null);
  const [currentOutputPresentationId, setCurrentOutputPresentationId] = useState<Id | null>(null);
  const [presentationBrowseSource, setPresentationBrowseSource] = useState<PresentationBrowseSource>('playlist');
  const [outputArmVersion, setOutputArmVersion] = useState(0);
  const [hasInitializedOutput, setHasInitializedOutput] = useState(false);
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
      setCurrentPlaylistId(nextPlaylistId);
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

    const nextPlaylistPresentationId = resolveCurrentPlaylistPresentationId(
      currentPlaylistPresentationId,
      selectedTree,
    );
    if (nextPlaylistPresentationId !== currentPlaylistPresentationId) {
      setCurrentPlaylistPresentationId(nextPlaylistPresentationId);
    }

    if (!hasInitializedOutput) {
      setCurrentOutputPresentationId(nextPlaylistPresentationId);
      setHasInitializedOutput(true);
    } else if (currentOutputPresentationId !== null) {
      const nextOutputPresentationId = resolveCurrentPlaylistPresentationId(
        currentOutputPresentationId,
        selectedTree,
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
    hasInitializedOutput,
    presentationBrowseSource,
    presentations,
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
    setCurrentLibraryId(libraryId);
    setCurrentPlaylistId(bundle.playlists[0]?.playlist.id ?? null);
    setStatusText(`Switched to ${bundle.library.name}`);
  }, [setStatusText, snapshot]);

  const selectPlaylistPresentation = useCallback((presentationId: Id) => {
    setCurrentPlaylistPresentationId(presentationId);
    setPresentationBrowseSource('playlist');
    setStatusText('Opened presentation');
  }, [setStatusText]);

  const browsePresentation = useCallback((presentationId: Id) => {
    setCurrentDrawerPresentationId(presentationId);
    setPresentationBrowseSource('project');
    setStatusText('Browsing presentation');
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
  }, [currentLibraryBundle, currentLibraryId, mutate, setStatusText]);

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
    setStatusText('Moved presentation to segment');
  }, [currentPlaylistId, currentPresentationId, mutate, setStatusText]);

  const moveCurrentPresentationToSegment = useCallback(async (segmentId: Id | null) => {
    if (!currentPresentationId || !currentPlaylistId) return;
    await mutate(() => window.castApi.movePresentationToSegment(currentPlaylistId, currentPresentationId, segmentId));
    setStatusText(segmentId ? 'Moved presentation to segment' : 'Removed presentation from playlist');
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
    setStatusText(`Renamed presentation: ${title}`);
  }, [mutate, setStatusText]);

  const setPresentationKind = useCallback(async (id: Id, kind: PresentationKind) => {
    await mutate(() => window.castApi.setPresentationKind(id, kind));
    setStatusText(kind === 'lyrics' ? 'Presentation type set to Lyrics' : 'Presentation type set to Canvas');
  }, [mutate, setStatusText]);

  const value = useMemo<NavigationContextValue>(() => ({
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
    createSegment,
    addPresentationToSegment,
    moveCurrentPresentationToSegment,
    renameLibrary,
    renamePlaylist,
    renamePresentation,
    setPresentationKind,
  }), [
    addPresentationToSegment,
    armOutputPresentation,
    browsePresentation,
    clearOutputPresentation,
    clearRecentlyCreated,
    createLibrary,
    createPlaylist,
    createPresentation,
    createSegment,
    currentDrawerPresentationId,
    currentLibraryBundle,
    currentLibraryId,
    currentOutputPresentationId,
    currentPlaylistId,
    currentPlaylistPresentation,
    currentPlaylistPresentationId,
    currentPresentation,
    currentPresentationId,
    moveCurrentPresentationToSegment,
    outputArmVersion,
    presentationBrowseSource,
    recentlyCreatedId,
    renameLibrary,
    renamePlaylist,
    renamePresentation,
    selectLibrary,
    selectPlaylistPresentation,
    setPresentationKind,
    slideCountByPresentation,
  ]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
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

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
}
