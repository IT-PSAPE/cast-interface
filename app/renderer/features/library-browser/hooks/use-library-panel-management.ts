import { useCallback } from 'react';
import type { AppSnapshot, ContentItemType, Id } from '@core/types';
import { useCast } from '../../../contexts/cast-context';

function findCreatedId(previousIds: Set<Id>, currentIds: Id[]): Id | null {
  for (const id of currentIds) {
    if (!previousIds.has(id)) return id;
  }
  return null;
}

export function useLibraryPanelManagement() {
  const { snapshot, mutate, setStatusText } = useCast();

  function getContentItems(nextSnapshot: AppSnapshot | null | undefined) {
    return [...(nextSnapshot?.decks ?? []), ...(nextSnapshot?.lyrics ?? [])];
  }

  function resolveContentItemType(itemId: Id): ContentItemType | null {
    if (snapshot?.decks.some((item) => item.id === itemId)) return 'deck';
    if (snapshot?.lyrics.some((item) => item.id === itemId)) return 'lyric';
    return null;
  }

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

  const renameContentItem = useCallback(async (id: Id, title: string) => {
    const itemType = resolveContentItemType(id);
    if (!itemType) return;
    await mutate(() => itemType === 'deck'
      ? window.castApi.renameDeck(id, title)
      : window.castApi.renameLyric(id, title));
    setStatusText(`Renamed item: ${title}`);
  }, [mutate, setStatusText, snapshot]);

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

  const deleteContentItem = useCallback(async (id: Id) => {
    const itemType = resolveContentItemType(id);
    if (!itemType) return;
    await mutate(() => itemType === 'deck'
      ? window.castApi.deleteDeck(id)
      : window.castApi.deleteLyric(id));
    setStatusText('Deleted item');
  }, [mutate, setStatusText, snapshot]);

  const moveContentItemToSegment = useCallback(async (playlistId: Id, itemId: Id, segmentId: Id | null) => {
    await mutate(() => window.castApi.moveContentItemToSegment(playlistId, itemId, segmentId));
    setStatusText(segmentId ? 'Moved item to segment' : 'Removed item from playlist');
  }, [mutate, setStatusText]);

  const movePlaylist = useCallback(async (id: Id, direction: 'up' | 'down') => {
    await mutate(() => window.castApi.movePlaylist(id, direction));
    setStatusText(direction === 'up' ? 'Moved playlist up' : 'Moved playlist down');
  }, [mutate, setStatusText]);

  const moveContentItem = useCallback(async (id: Id, direction: 'up' | 'down') => {
    await mutate(() => window.castApi.moveContentItem(id, direction));
    setStatusText(direction === 'up' ? 'Moved item up' : 'Moved item down');
  }, [mutate, setStatusText]);

  const addContentItemToSegment = useCallback(async (segmentId: Id, itemId: Id) => {
    await mutate(() => window.castApi.addContentItemToSegment(segmentId, itemId));
    setStatusText('Added item to segment');
  }, [mutate, setStatusText]);

  const createContentItemEntryInSegment = useCallback(async (
    segmentId: Id,
    createEntry: () => Promise<AppSnapshot>,
    createSlide: (itemId: Id) => Promise<AppSnapshot>,
    statusText: string,
  ) => {
    const previousItemIds = new Set(getContentItems(snapshot).map((item) => item.id));
    const next = await mutate(createEntry);
    const nextItems = getContentItems(next);
    const createdItemId = findCreatedId(previousItemIds, nextItems.map((item) => item.id))
      ?? nextItems.at(-1)?.id
      ?? null;
    if (!createdItemId) return null;

    await mutate(() => createSlide(createdItemId));
    await mutate(() => window.castApi.addContentItemToSegment(segmentId, createdItemId));
    setStatusText(statusText);
    return createdItemId;
  }, [snapshot, mutate, setStatusText]);

  const createDeckInSegment = useCallback(async (_libraryId: Id, segmentId: Id) => {
    return createContentItemEntryInSegment(
      segmentId,
      () => window.castApi.createDeck('New Deck'),
      (itemId) => window.castApi.createSlide({ deckId: itemId }),
      'Created deck and added to segment'
    );
  }, [createContentItemEntryInSegment]);

  const createLyricInSegment = useCallback(async (_libraryId: Id, segmentId: Id) => {
    return createContentItemEntryInSegment(
      segmentId,
      () => window.castApi.createLyric('New Lyric'),
      (itemId) => window.castApi.createSlide({ lyricId: itemId }),
      'Created lyric and added to segment'
    );
  }, [createContentItemEntryInSegment]);

  return {
    renameLibrary,
    renamePlaylist,
    renameSegment,
    setSegmentColor,
    renameContentItem,
    deleteLibrary,
    deletePlaylist,
    deleteSegment,
    deleteContentItem,
    moveContentItemToSegment,
    movePlaylist,
    moveContentItem,
    addContentItemToSegment,
    createDeckInSegment,
    createLyricInSegment
  };
}
