import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC, NDI_EVENTS } from '@core/ipc';
import type {
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  MediaAsset,
  PresentationKind,
  NdiOutputName,
  NdiOutputState,
  OverlayCreateInput,
  SlideCreateInput,
  SlideFrame
} from '@core/types';

const api = {
  getSnapshot: () => ipcRenderer.invoke(IPC.getSnapshot),
  createLibrary: (name: string) => ipcRenderer.invoke(IPC.createLibrary, name),
  createPlaylist: (libraryId: Id, name: string) => ipcRenderer.invoke(IPC.createPlaylist, libraryId, name),
  createPlaylistSegment: (playlistId: Id, name: string) => ipcRenderer.invoke(IPC.createPlaylistSegment, playlistId, name),
  renamePlaylistSegment: (id: Id, name: string) => ipcRenderer.invoke(IPC.renamePlaylistSegment, id, name),
  setPlaylistSegmentColor: (id: Id, colorKey: string | null) => ipcRenderer.invoke(IPC.setPlaylistSegmentColor, id, colorKey),
  movePlaylist: (id: Id, direction: 'up' | 'down') => ipcRenderer.invoke(IPC.movePlaylist, id, direction),
  addPresentationToSegment: (segmentId: Id, presentationId: Id) =>
    ipcRenderer.invoke(IPC.addPresentationToSegment, segmentId, presentationId),
  movePresentationToSegment: (playlistId: Id, presentationId: Id, segmentId: Id | null) =>
    ipcRenderer.invoke(IPC.movePresentationToSegment, playlistId, presentationId, segmentId),
  movePresentation: (id: Id, direction: 'up' | 'down') => ipcRenderer.invoke(IPC.movePresentation, id, direction),
  createPresentation: (libraryId: Id, title: string, kind?: PresentationKind) =>
    ipcRenderer.invoke(IPC.createPresentation, libraryId, title, kind),
  setPresentationKind: (id: Id, kind: PresentationKind) => ipcRenderer.invoke(IPC.setPresentationKind, id, kind),
  createSlide: (input: SlideCreateInput) => ipcRenderer.invoke(IPC.createSlide, input),
  createElement: (input: ElementCreateInput) => ipcRenderer.invoke(IPC.createElement, input),
  createElementsBatch: (inputs: ElementCreateInput[]) => ipcRenderer.invoke(IPC.createElementsBatch, inputs),
  updateElement: (input: ElementUpdateInput) => ipcRenderer.invoke(IPC.updateElement, input),
  updateElementsBatch: (inputs: ElementUpdateInput[]) => ipcRenderer.invoke(IPC.updateElementsBatch, inputs),
  deleteElement: (id: Id) => ipcRenderer.invoke(IPC.deleteElement, id),
  deleteElementsBatch: (ids: Id[]) => ipcRenderer.invoke(IPC.deleteElementsBatch, ids),
  createMediaAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) => ipcRenderer.invoke(IPC.createMediaAsset, asset),
  deleteMediaAsset: (id: Id) => ipcRenderer.invoke(IPC.deleteMediaAsset, id),
  updateMediaAssetSrc: (id: Id, src: string) => ipcRenderer.invoke(IPC.updateMediaAssetSrc, id, src),
  createOverlay: (overlay: OverlayCreateInput) => ipcRenderer.invoke(IPC.createOverlay, overlay),
  setOverlayEnabled: (overlayId: Id, enabled: boolean) => ipcRenderer.invoke(IPC.setOverlayEnabled, overlayId, enabled),
  renameLibrary: (id: Id, name: string) => ipcRenderer.invoke(IPC.renameLibrary, id, name),
  renamePlaylist: (id: Id, name: string) => ipcRenderer.invoke(IPC.renamePlaylist, id, name),
  renamePresentation: (id: Id, title: string) => ipcRenderer.invoke(IPC.renamePresentation, id, title),
  deleteLibrary: (id: Id) => ipcRenderer.invoke(IPC.deleteLibrary, id),
  deletePlaylist: (id: Id) => ipcRenderer.invoke(IPC.deletePlaylist, id),
  deletePlaylistSegment: (id: Id) => ipcRenderer.invoke(IPC.deletePlaylistSegment, id),
  deletePresentation: (id: Id) => ipcRenderer.invoke(IPC.deletePresentation, id),
  sendNdiFrame: (frame: SlideFrame) => ipcRenderer.invoke(IPC.sendNdiFrame, frame),
  connectNdiFramePort: () => {
    const channel = new MessageChannel();
    ipcRenderer.postMessage(IPC.connectNdiFramePort, null, [channel.port1]);
    return channel.port2;
  },
  setNdiOutputEnabled: (name: NdiOutputName, enabled: boolean) =>
    ipcRenderer.invoke(IPC.setNdiOutputEnabled, name, enabled),
  getNdiOutputState: () => ipcRenderer.invoke(IPC.getNdiOutputState),
  onNdiOutputStateChanged: (callback: (state: NdiOutputState) => void) => {
    const handler = (_event: IpcRendererEvent, state: NdiOutputState) => callback(state);
    ipcRenderer.on(NDI_EVENTS.outputStateChanged, handler);
    return () => { ipcRenderer.removeListener(NDI_EVENTS.outputStateChanged, handler); };
  }
};

contextBridge.exposeInMainWorld('castApi', api);
