import { useCallback } from 'react';
import type { AppSnapshot, Id } from '@core/types';
import { useCast } from '../../../contexts/cast-context';

function findCreatedId(previousIds: Set<Id>, currentIds: Id[]): Id | null {
  for (const id of currentIds) {
    if (!previousIds.has(id)) return id;
  }
  return null;
}

export function useLibraryPanelManagement() {
  const { snapshot, mutate, setStatusText } = useCast();

  const renameLibrary = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renameLibrary(id, name));
    setStatusText(`Renamed library: ${name}`);
  }, [mutate, setStatusText]);

  const renamePlaylist = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renamePlaylist(id, name));
    setStatusText(`Renamed playlist: ${name}`);
  }, [mutate, setStatusText]);

  const renameSegment = useCallback(async (id: Id, name: string) => {
    await mutate(() => window.castApi.renamePlaylistSegment(id, name));
    setStatusText(`Renamed segment: ${name}`);
  }, [mutate, setStatusText]);

  const setSegmentColor = useCallback(async (id: Id, colorKey: string | null) => {
    const setColorApi = (window.castApi as { setPlaylistSegmentColor?: (segmentId: Id, nextColorKey: string | null) => Promise<AppSnapshot> }).setPlaylistSegmentColor;
    if (!setColorApi) {
      setStatusText('Restart required: segment color API is not loaded');
      return;
    }

    try {
      await mutate(() => setColorApi(id, colorKey));
      setStatusText(colorKey ? 'Updated segment color' : 'Removed segment color');
    } catch {
      setStatusText('Failed to update segment color');
    }
  }, [mutate, setStatusText]);

  const renamePresentation = useCallback(async (id: Id, title: string) => {
    await mutate(() => window.castApi.renamePresentation(id, title));
    setStatusText(`Renamed presentation: ${title}`);
  }, [mutate, setStatusText]);

  const deleteLibrary = useCallback(async (id: Id) => {
    await mutate(() => window.castApi.deleteLibrary(id));
    setStatusText('Deleted library');
  }, [mutate, setStatusText]);

  const deletePlaylist = useCallback(async (id: Id) => {
    await mutate(() => window.castApi.deletePlaylist(id));
    setStatusText('Deleted playlist');
  }, [mutate, setStatusText]);

  const deleteSegment = useCallback(async (id: Id) => {
    await mutate(() => window.castApi.deletePlaylistSegment(id));
    setStatusText('Deleted segment');
  }, [mutate, setStatusText]);

  const deletePresentation = useCallback(async (id: Id) => {
    await mutate(() => window.castApi.deletePresentation(id));
    setStatusText('Deleted presentation');
  }, [mutate, setStatusText]);

  const movePresentationToSegment = useCallback(async (playlistId: Id, presentationId: Id, segmentId: Id | null) => {
    await mutate(() => window.castApi.movePresentationToSegment(playlistId, presentationId, segmentId));
    setStatusText(segmentId ? 'Moved presentation to segment' : 'Removed presentation from playlist');
  }, [mutate, setStatusText]);

  const movePlaylist = useCallback(async (id: Id, direction: 'up' | 'down') => {
    await mutate(() => window.castApi.movePlaylist(id, direction));
    setStatusText(direction === 'up' ? 'Moved playlist up' : 'Moved playlist down');
  }, [mutate, setStatusText]);

  const movePresentation = useCallback(async (id: Id, direction: 'up' | 'down') => {
    await mutate(() => window.castApi.movePresentation(id, direction));
    setStatusText(direction === 'up' ? 'Moved presentation up' : 'Moved presentation down');
  }, [mutate, setStatusText]);

  const addPresentationToSegment = useCallback(async (segmentId: Id, presentationId: Id) => {
    await mutate(() => window.castApi.addPresentationToSegment(segmentId, presentationId));
    setStatusText('Added presentation to segment');
  }, [mutate, setStatusText]);

  const createPresentationInSegment = useCallback(async (_libraryId: Id, segmentId: Id) => {
    const previousPresentationIds = new Set(snapshot?.presentations.map((presentation) => presentation.id) ?? []);

    const next = await mutate(() => window.castApi.createPresentation('New Presentation'));
    const createdPresentationId = findCreatedId(
      previousPresentationIds,
      next.presentations.map((presentation) => presentation.id)
    ) ?? next.presentations.at(-1)?.id ?? null;
    if (!createdPresentationId) return null;

    await mutate(() => window.castApi.createSlide({ presentationId: createdPresentationId }));
    await mutate(() => window.castApi.addPresentationToSegment(segmentId, createdPresentationId));
    setStatusText('Created presentation and added to segment');
    return createdPresentationId;
  }, [snapshot, mutate, setStatusText]);

  return {
    renameLibrary,
    renamePlaylist,
    renameSegment,
    setSegmentColor,
    renamePresentation,
    deleteLibrary,
    deletePlaylist,
    deleteSegment,
    deletePresentation,
    movePresentationToSegment,
    movePlaylist,
    movePresentation,
    addPresentationToSegment,
    createPresentationInSegment
  };
}
