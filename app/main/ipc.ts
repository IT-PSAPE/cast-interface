import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { CastRepository } from '@database/store';
import { IPC, NDI_EVENTS } from '@core/ipc';
import type {
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  MediaAsset,
  PresentationKind,
  NdiOutputName,
  OverlayCreateInput,
  OverlayUpdateInput,
  SlideCreateInput,
  SlideNotesUpdateInput,
  SlideFrame
} from '@core/types';
import { NdiService } from './ndi/ndi-service';

function safeHandle<Args extends unknown[], R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => R,
): void {
  ipcMain.handle(channel, async (event, ...args: unknown[]) => {
    try {
      return await handler(event, ...(args as Args));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[IPC ${channel}]`, message);
      throw new Error(message);
    }
  });
}

export const registerIpcHandlers = (
  repo: CastRepository,
  ndiService: NdiService,
  getMainWindow: () => BrowserWindow | null
): void => {
  ndiService.onOutputStateChanged((state) => {
    getMainWindow()?.webContents.send(NDI_EVENTS.outputStateChanged, state);
  });

  safeHandle(IPC.getSnapshot, () => repo.getSnapshot());
  safeHandle(IPC.createLibrary, (_event, name: string) => repo.createLibrary(name));
  safeHandle(IPC.createPlaylist, (_event, libraryId: Id, name: string) => repo.createPlaylist(libraryId, name));
  safeHandle(IPC.createPlaylistSegment, (_event, playlistId: Id, name: string) =>
    repo.createPlaylistSegment(playlistId, name)
  );
  safeHandle(IPC.renamePlaylistSegment, (_event, id: Id, name: string) =>
    repo.renamePlaylistSegment(id, name)
  );
  safeHandle(IPC.setPlaylistSegmentColor, (_event, id: Id, colorKey: string | null) =>
    repo.setPlaylistSegmentColor(id, colorKey)
  );
  safeHandle(IPC.movePlaylist, (_event, id: Id, direction: 'up' | 'down') =>
    repo.movePlaylist(id, direction)
  );
  safeHandle(IPC.addPresentationToSegment, (_event, segmentId: Id, presentationId: Id) =>
    repo.addPresentationToSegment(segmentId, presentationId)
  );
  safeHandle(IPC.movePresentationToSegment, (_event, playlistId: Id, presentationId: Id, segmentId: Id | null) =>
    repo.movePresentationToSegment(playlistId, presentationId, segmentId)
  );
  safeHandle(IPC.movePresentation, (_event, id: Id, direction: 'up' | 'down') =>
    repo.movePresentation(id, direction)
  );
  safeHandle(IPC.createPresentation, (_event, title: string, kind?: PresentationKind) =>
    repo.createPresentation(title, kind)
  );
  safeHandle(IPC.setPresentationKind, (_event, id: Id, kind: PresentationKind) =>
    repo.setPresentationKind(id, kind)
  );
  safeHandle(IPC.createSlide, (_event, input: SlideCreateInput) => repo.createSlide(input));
  safeHandle(IPC.updateSlideNotes, (_event, input: SlideNotesUpdateInput) => repo.updateSlideNotes(input));
  safeHandle(IPC.createElement, (_event, input: ElementCreateInput) => repo.createElement(input));
  safeHandle(IPC.createElementsBatch, (_event, inputs: ElementCreateInput[]) => repo.createElementsBatch(inputs));
  safeHandle(IPC.updateElement, (_event, input: ElementUpdateInput) => repo.updateElement(input));
  safeHandle(IPC.updateElementsBatch, (_event, inputs: ElementUpdateInput[]) => repo.updateElementsBatch(inputs));
  safeHandle(IPC.deleteElement, (_event, id: Id) => repo.deleteElement(id));
  safeHandle(IPC.deleteElementsBatch, (_event, ids: Id[]) => repo.deleteElementsBatch(ids));
  safeHandle(IPC.createMediaAsset, (_event, asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) =>
    repo.createMediaAsset(asset)
  );
  safeHandle(IPC.deleteMediaAsset, (_event, id: Id) => repo.deleteMediaAsset(id));
  safeHandle(IPC.updateMediaAssetSrc, (_event, id: Id, src: string) => repo.updateMediaAssetSrc(id, src));
  safeHandle(IPC.createOverlay, (_event, overlay: OverlayCreateInput) => repo.createOverlay(overlay));
  safeHandle(IPC.updateOverlay, (_event, input: OverlayUpdateInput) => repo.updateOverlay(input));
  safeHandle(IPC.setOverlayEnabled, (_event, overlayId: Id, enabled: boolean) => repo.setOverlayEnabled(overlayId, enabled));
  safeHandle(IPC.deleteOverlay, (_event, overlayId: Id) => repo.deleteOverlay(overlayId));
  safeHandle(IPC.renameLibrary, (_event, id: Id, name: string) => repo.renameLibrary(id, name));
  safeHandle(IPC.renamePlaylist, (_event, id: Id, name: string) => repo.renamePlaylist(id, name));
  safeHandle(IPC.renamePresentation, (_event, id: Id, title: string) => repo.renamePresentation(id, title));
  safeHandle(IPC.deleteLibrary, (_event, id: Id) => repo.deleteLibrary(id));
  safeHandle(IPC.deletePlaylist, (_event, id: Id) => repo.deletePlaylist(id));
  safeHandle(IPC.deletePlaylistSegment, (_event, id: Id) => repo.deletePlaylistSegment(id));
  safeHandle(IPC.deletePresentation, (_event, id: Id) => repo.deletePresentation(id));
  safeHandle(IPC.sendNdiFrame, (_event, frame: SlideFrame) => {
    ndiService.sendFrame(frame);
  });
  safeHandle(IPC.setNdiOutputEnabled, (_event, name: NdiOutputName, enabled: boolean) => {
    return ndiService.setOutputEnabled(name, enabled);
  });
  safeHandle(IPC.getNdiOutputState, () => ndiService.getOutputState());
};
