import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { Id, LibraryBundle, Presentation, PresentationKind } from '@core/types';
import type { SidebarStage } from '../types/ui';
import { useCast } from './cast-context';

interface NavigationContextValue {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  currentPresentationId: Id | null;
  sidebarStage: SidebarStage;
  activeBundle: LibraryBundle | null;
  currentPresentation: Presentation | null;
  slideCountByPresentation: Map<Id, number>;
  recentlyCreatedId: Id | null;
  selectLibrary: (id: Id) => void;
  openPresentation: (id: Id) => void;
  setCurrentPlaylistId: (id: Id | null) => void;
  setCurrentPresentationId: (id: Id | null) => void;
  setSidebarStage: (stage: SidebarStage) => void;
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

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { snapshot, mutate, setStatusText } = useCast();

  const [currentLibraryId, setCurrentLibraryId] = useState<Id | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<Id | null>(null);
  const [currentPresentationId, setCurrentPresentationId] = useState<Id | null>(null);
  const [sidebarStage, setSidebarStage] = useState<SidebarStage>('libraries');
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<Id | null>(null);

  useEffect(() => {
    if (!snapshot || snapshot.libraries.length === 0) return;
    if (!currentLibraryId || !snapshot.libraries.some((l) => l.id === currentLibraryId)) {
      setCurrentLibraryId(snapshot.libraries[0].id);
      return;
    }
    const bundle = snapshot.bundles.find((b) => b.library.id === currentLibraryId);
    if (!bundle) return;
    if (!currentPresentationId || !bundle.presentations.some((p) => p.id === currentPresentationId)) {
      const nextPresentationId = bundle.presentations[0]?.id ?? null;
      if (nextPresentationId !== currentPresentationId) setCurrentPresentationId(nextPresentationId);
    }
    if (!currentPlaylistId || !bundle.playlists.some((p) => p.playlist.id === currentPlaylistId)) {
      const nextPlaylistId = bundle.playlists[0]?.playlist.id ?? null;
      if (nextPlaylistId !== currentPlaylistId) setCurrentPlaylistId(nextPlaylistId);
    }
  }, [snapshot, currentLibraryId, currentPresentationId, currentPlaylistId]);

  const activeBundle = useMemo<LibraryBundle | null>(() => {
    if (!snapshot || !currentLibraryId) return null;
    return snapshot.bundles.find((b) => b.library.id === currentLibraryId) ?? null;
  }, [snapshot, currentLibraryId]);

  const currentPresentation = useMemo(
    () => activeBundle?.presentations.find((p) => p.id === currentPresentationId) ?? null,
    [activeBundle, currentPresentationId],
  );

  const slideCountByPresentation = useMemo(() => {
    if (!activeBundle) return new Map<Id, number>();
    const map = new Map<Id, number>();
    for (const slide of activeBundle.slides) {
      map.set(slide.presentationId, (map.get(slide.presentationId) ?? 0) + 1);
    }
    return map;
  }, [activeBundle]);

  const clearRecentlyCreated = useCallback(() => { setRecentlyCreatedId(null); }, []);

  function findNewId(previousIds: Set<Id>, currentIds: Id[]): Id | null {
    for (const id of currentIds) {
      if (!previousIds.has(id)) return id;
    }
    return null;
  }

  const selectLibrary = useCallback((libraryId: Id) => {
    if (!snapshot) return;
    const bundle = snapshot.bundles.find((b) => b.library.id === libraryId);
    if (!bundle) return;
    setCurrentLibraryId(libraryId);
    setCurrentPresentationId(bundle.presentations[0]?.id ?? null);
    setCurrentPlaylistId(bundle.playlists[0]?.playlist.id ?? null);
    setSidebarStage('playlists');
    setStatusText(`Switched to ${bundle.library.name}`);
  }, [snapshot, setStatusText]);

  const openPresentation = useCallback((presentationId: Id) => {
    setCurrentPresentationId(presentationId);
    setStatusText('Opened presentation');
  }, [setStatusText]);

  const createLibrary = useCallback(async () => {
    const previousIds = new Set(snapshot?.libraries.map((l) => l.id) ?? []);
    const next = await mutate(() => window.castApi.createLibrary('New Library'));
    setSidebarStage('libraries');
    setStatusText('Created library');
    const createdId = findNewId(previousIds, next.libraries.map((l) => l.id));
    if (createdId) setRecentlyCreatedId(createdId);
  }, [snapshot, mutate, setStatusText]);

  const createPlaylist = useCallback(async () => {
    if (!currentLibraryId) return;
    const previousIds = new Set(activeBundle?.playlists.map((p) => p.playlist.id) ?? []);
    const next = await mutate(() => window.castApi.createPlaylist(currentLibraryId, 'New Playlist'));
    setStatusText('Created playlist');
    const updatedBundle = next.bundles.find((b) => b.library.id === currentLibraryId);
    const createdId = findNewId(previousIds, updatedBundle?.playlists.map((p) => p.playlist.id) ?? []);
    if (createdId) {
      setCurrentPlaylistId(createdId);
      setRecentlyCreatedId(createdId);
    }
  }, [currentLibraryId, activeBundle, mutate, setStatusText]);

  const createPresentation = useCallback(async () => {
    if (!currentLibraryId) return;
    const previousIds = new Set(activeBundle?.presentations.map((p) => p.id) ?? []);
    const next = await mutate(() => window.castApi.createPresentation(currentLibraryId, 'New Presentation'));
    const updatedBundle = next.bundles.find((b) => b.library.id === currentLibraryId);
    const createdId = findNewId(previousIds, updatedBundle?.presentations.map((p) => p.id) ?? []);
    if (!createdId) return;
    await mutate(() => window.castApi.createSlide({ presentationId: createdId }));
    setCurrentPresentationId(createdId);
    setRecentlyCreatedId(createdId);
    setStatusText(currentPlaylistId ? 'Created presentation in library' : 'Created presentation');
  }, [currentLibraryId, currentPlaylistId, activeBundle, mutate, setStatusText]);

  const createSegment = useCallback(async () => {
    if (!currentPlaylistId) return;
    const currentTree = activeBundle?.playlists.find((p) => p.playlist.id === currentPlaylistId);
    const previousIds = new Set(currentTree?.segments.map((s) => s.segment.id) ?? []);
    const next = await mutate(() => window.castApi.createPlaylistSegment(currentPlaylistId, 'New Segment'));
    setStatusText('Created segment');
    const updatedBundle = next.bundles.find((b) => b.library.id === currentLibraryId);
    const updatedTree = updatedBundle?.playlists.find((p) => p.playlist.id === currentPlaylistId);
    const createdId = findNewId(previousIds, updatedTree?.segments.map((s) => s.segment.id) ?? []);
    if (createdId) setRecentlyCreatedId(createdId);
  }, [currentPlaylistId, currentLibraryId, activeBundle, mutate, setStatusText]);

  const addPresentationToSegment = useCallback(async (segmentId: Id) => {
    if (!currentPresentationId || !currentPlaylistId) return;
    await mutate(() => window.castApi.addPresentationToSegment(segmentId, currentPresentationId));
    setStatusText('Moved presentation to segment');
  }, [currentPresentationId, currentPlaylistId, mutate, setStatusText]);

  const moveCurrentPresentationToSegment = useCallback(async (segmentId: Id | null) => {
    if (!currentPresentationId || !currentPlaylistId) return;
    await mutate(() => window.castApi.movePresentationToSegment(currentPlaylistId, currentPresentationId, segmentId));
    setStatusText(segmentId ? 'Moved presentation to segment' : 'Removed presentation from playlist');
  }, [currentPresentationId, currentPlaylistId, mutate, setStatusText]);

  const renameLibraryAction = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renameLibrary(id, name));
    setStatusText(`Renamed library: ${name}`);
  }, [mutate, setStatusText]);

  const renamePlaylistAction = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renamePlaylist(id, name));
    setStatusText(`Renamed playlist: ${name}`);
  }, [mutate, setStatusText]);

  const renamePresentationAction = useCallback(async (id: Id, title: string) => {
    await mutate(() => window.castApi.renamePresentation(id, title));
    setStatusText(`Renamed presentation: ${title}`);
  }, [mutate, setStatusText]);

  const setPresentationKindAction = useCallback(async (id: Id, kind: PresentationKind) => {
    await mutate(() => window.castApi.setPresentationKind(id, kind));
    setStatusText(kind === 'lyrics' ? 'Presentation type set to Lyrics' : 'Presentation type set to Canvas');
  }, [mutate, setStatusText]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      currentLibraryId, currentPlaylistId, currentPresentationId, sidebarStage,
      activeBundle, currentPresentation, slideCountByPresentation, recentlyCreatedId,
      selectLibrary, openPresentation, setCurrentPlaylistId, setCurrentPresentationId,
      setSidebarStage, clearRecentlyCreated, createLibrary, createPlaylist, createPresentation,
      createSegment, addPresentationToSegment, moveCurrentPresentationToSegment,
      renameLibrary: renameLibraryAction, renamePlaylist: renamePlaylistAction,
      renamePresentation: renamePresentationAction, setPresentationKind: setPresentationKindAction,
    }),
    [currentLibraryId, currentPlaylistId, currentPresentationId, sidebarStage,
     activeBundle, currentPresentation, slideCountByPresentation, recentlyCreatedId,
     selectLibrary, openPresentation, createLibrary, createPlaylist, createPresentation,
     createSegment, addPresentationToSegment, moveCurrentPresentationToSegment,
     renameLibraryAction, renamePlaylistAction, renamePresentationAction, setPresentationKindAction],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
