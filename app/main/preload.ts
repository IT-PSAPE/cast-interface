import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron';
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
  OverlayUpdateInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  SlideCreateInput,
  SlideNotesUpdateInput,
  SlideFrame
} from '@core/types';

let ndiFramePort: MessagePort | null = null;

ipcRenderer.on(NDI_EVENTS.framePort, (event) => {
  const [port] = event.ports;
  if (port) {
    ndiFramePort = port;
  }
});

const api = {
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
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
  createPresentation: (title: string, kind?: PresentationKind) =>
    ipcRenderer.invoke(IPC.createPresentation, title, kind),
  createLyric: (title: string) => ipcRenderer.invoke(IPC.createLyric, title),
  setPresentationKind: (id: Id, kind: PresentationKind) => ipcRenderer.invoke(IPC.setPresentationKind, id, kind),
  createSlide: (input: SlideCreateInput) => ipcRenderer.invoke(IPC.createSlide, input),
  updateSlideNotes: (input: SlideNotesUpdateInput) => ipcRenderer.invoke(IPC.updateSlideNotes, input),
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
  updateOverlay: (input: OverlayUpdateInput) => ipcRenderer.invoke(IPC.updateOverlay, input),
  setOverlayEnabled: (overlayId: Id, enabled: boolean) => ipcRenderer.invoke(IPC.setOverlayEnabled, overlayId, enabled),
  deleteOverlay: (overlayId: Id) => ipcRenderer.invoke(IPC.deleteOverlay, overlayId),
  createTemplate: (input: TemplateCreateInput) => ipcRenderer.invoke(IPC.createTemplate, input),
  updateTemplate: (input: TemplateUpdateInput) => ipcRenderer.invoke(IPC.updateTemplate, input),
  deleteTemplate: (templateId: Id) => ipcRenderer.invoke(IPC.deleteTemplate, templateId),
  applyTemplateToPresentation: (templateId: Id, presentationId: Id) =>
    ipcRenderer.invoke(IPC.applyTemplateToPresentation, templateId, presentationId),
  applyTemplateToOverlay: (templateId: Id, overlayId: Id) =>
    ipcRenderer.invoke(IPC.applyTemplateToOverlay, templateId, overlayId),
  renameLibrary: (id: Id, name: string) => ipcRenderer.invoke(IPC.renameLibrary, id, name),
  renamePlaylist: (id: Id, name: string) => ipcRenderer.invoke(IPC.renamePlaylist, id, name),
  renamePresentation: (id: Id, title: string) => ipcRenderer.invoke(IPC.renamePresentation, id, title),
  deleteLibrary: (id: Id) => ipcRenderer.invoke(IPC.deleteLibrary, id),
  deletePlaylist: (id: Id) => ipcRenderer.invoke(IPC.deletePlaylist, id),
  deletePlaylistSegment: (id: Id) => ipcRenderer.invoke(IPC.deletePlaylistSegment, id),
  deletePresentation: (id: Id) => ipcRenderer.invoke(IPC.deletePresentation, id),
  sendNdiFrame: (frame: SlideFrame) => ipcRenderer.invoke(IPC.sendNdiFrame, frame),
  sendNdiFrameZeroCopy: (frame: SlideFrame) => {
    if (!ndiFramePort) {
      ipcRenderer.invoke(IPC.sendNdiFrame, frame);
      return;
    }
    const rgba = frame.rgba.byteOffset === 0 && frame.rgba.byteLength === frame.rgba.buffer.byteLength
      ? frame.rgba.buffer
      : frame.rgba.buffer.slice(
        frame.rgba.byteOffset,
        frame.rgba.byteOffset + frame.rgba.byteLength
      );
    ndiFramePort.postMessage(
      { width: frame.width, height: frame.height, rgba, timestamp: frame.timestamp },
      [rgba]
    );
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
