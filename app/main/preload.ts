import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron';
import { IPC, NDI_EVENTS } from '@core/ipc';
import type {
  AppSnapshot,
  ContentBundleBrokenReferenceDecision,
  ContentBundleInspection,
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  MediaAsset,
  NdiDiagnostics,
  NdiOutputConfig,
  NdiOutputConfigMap,
  NdiOutputName,
  NdiOutputState,
  OverlayCreateInput,
  OverlayUpdateInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  SlideCreateInput,
  SlideNotesUpdateInput,
  SlideOrderUpdateInput
} from '@core/types';

const api = {
  platform: process.platform,
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  getInlineWindowMenuItems: () => ipcRenderer.invoke(IPC.getInlineWindowMenuItems) as Promise<import('@core/ipc').InlineWindowMenuItem[]>,
  popupInlineWindowMenu: (menuId: string, x: number, y: number) => ipcRenderer.invoke(IPC.popupInlineWindowMenu, menuId, x, y) as Promise<void>,
  getSnapshot: () => ipcRenderer.invoke(IPC.getSnapshot),
  chooseContentBundleExportPath: (suggestedName: string) => ipcRenderer.invoke(IPC.chooseContentBundleExportPath, suggestedName) as Promise<string | null>,
  chooseContentBundleImportPath: () => ipcRenderer.invoke(IPC.chooseContentBundleImportPath) as Promise<string | null>,
  chooseImportReplacementMediaPath: () => ipcRenderer.invoke(IPC.chooseImportReplacementMediaPath) as Promise<string | null>,
  exportContentBundle: (itemIds: Id[], filePath: string) => ipcRenderer.invoke(IPC.exportContentBundle, itemIds, filePath) as Promise<{ filePath: string; itemCount: number }>,
  inspectImportBundle: (filePath: string) => ipcRenderer.invoke(IPC.inspectImportBundle, filePath) as Promise<ContentBundleInspection>,
  finalizeImportBundle: (filePath: string, decisions: ContentBundleBrokenReferenceDecision[]) =>
    ipcRenderer.invoke(IPC.finalizeImportBundle, filePath, decisions) as Promise<AppSnapshot>,
  createLibrary: (name: string) => ipcRenderer.invoke(IPC.createLibrary, name),
  createPlaylist: (libraryId: Id, name: string) => ipcRenderer.invoke(IPC.createPlaylist, libraryId, name),
  createPlaylistSegment: (playlistId: Id, name: string) => ipcRenderer.invoke(IPC.createPlaylistSegment, playlistId, name),
  renamePlaylistSegment: (id: Id, name: string) => ipcRenderer.invoke(IPC.renamePlaylistSegment, id, name),
  setPlaylistSegmentColor: (id: Id, colorKey: string | null) => ipcRenderer.invoke(IPC.setPlaylistSegmentColor, id, colorKey),
  movePlaylist: (id: Id, direction: 'up' | 'down') => ipcRenderer.invoke(IPC.movePlaylist, id, direction),
  addContentItemToSegment: (segmentId: Id, itemId: Id) =>
    ipcRenderer.invoke(IPC.addContentItemToSegment, segmentId, itemId),
  moveContentItemToSegment: (playlistId: Id, itemId: Id, segmentId: Id | null) =>
    ipcRenderer.invoke(IPC.moveContentItemToSegment, playlistId, itemId, segmentId),
  moveContentItem: (id: Id, direction: 'up' | 'down') => ipcRenderer.invoke(IPC.moveContentItem, id, direction),
  createDeck: (title: string) => ipcRenderer.invoke(IPC.createDeck, title),
  createLyric: (title: string) => ipcRenderer.invoke(IPC.createLyric, title),
  createSlide: (input: SlideCreateInput) => ipcRenderer.invoke(IPC.createSlide, input),
  deleteSlide: (slideId: Id) => ipcRenderer.invoke(IPC.deleteSlide, slideId),
  updateSlideNotes: (input: SlideNotesUpdateInput) => ipcRenderer.invoke(IPC.updateSlideNotes, input),
  setSlideOrder: (input: SlideOrderUpdateInput) => ipcRenderer.invoke(IPC.setSlideOrder, input),
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
  applyTemplateToContentItem: (templateId: Id, itemId: Id) =>
    ipcRenderer.invoke(IPC.applyTemplateToContentItem, templateId, itemId),
  resetContentItemToTemplate: (itemId: Id) =>
    ipcRenderer.invoke(IPC.resetContentItemToTemplate, itemId),
  applyTemplateToOverlay: (templateId: Id, overlayId: Id) =>
    ipcRenderer.invoke(IPC.applyTemplateToOverlay, templateId, overlayId),
  renameLibrary: (id: Id, name: string) => ipcRenderer.invoke(IPC.renameLibrary, id, name),
  renamePlaylist: (id: Id, name: string) => ipcRenderer.invoke(IPC.renamePlaylist, id, name),
  renameDeck: (id: Id, title: string) => ipcRenderer.invoke(IPC.renameDeck, id, title),
  renameLyric: (id: Id, title: string) => ipcRenderer.invoke(IPC.renameLyric, id, title),
  deleteLibrary: (id: Id) => ipcRenderer.invoke(IPC.deleteLibrary, id),
  deletePlaylist: (id: Id) => ipcRenderer.invoke(IPC.deletePlaylist, id),
  deletePlaylistSegment: (id: Id) => ipcRenderer.invoke(IPC.deletePlaylistSegment, id),
  deleteDeck: (id: Id) => ipcRenderer.invoke(IPC.deleteDeck, id),
  deleteLyric: (id: Id) => ipcRenderer.invoke(IPC.deleteLyric, id),
  setNdiOutputEnabled: (name: NdiOutputName, enabled: boolean) =>
    ipcRenderer.invoke(IPC.setNdiOutputEnabled, name, enabled),
  getNdiOutputState: () => ipcRenderer.invoke(IPC.getNdiOutputState),
  getNdiOutputConfigs: () => ipcRenderer.invoke(IPC.getNdiOutputConfigs) as Promise<NdiOutputConfigMap>,
  updateNdiOutputConfig: (name: NdiOutputName, config: Partial<NdiOutputConfig>) =>
    ipcRenderer.invoke(IPC.updateNdiOutputConfig, name, config) as Promise<NdiOutputConfigMap>,
  getNdiDiagnostics: () => ipcRenderer.invoke(IPC.getNdiDiagnostics) as Promise<NdiDiagnostics>,
  sendNdiFrame: (buffer: ArrayBuffer, width: number, height: number) => {
    ipcRenderer.send(IPC.sendNdiFrame, buffer, width, height);
  },
  onNdiOutputStateChanged: (callback: (state: NdiOutputState) => void) => {
    const handler = (_event: IpcRendererEvent, state: NdiOutputState) => callback(state);
    ipcRenderer.on(NDI_EVENTS.outputStateChanged, handler);
    return () => { ipcRenderer.removeListener(NDI_EVENTS.outputStateChanged, handler); };
  },
  onNdiDiagnosticsChanged: (callback: (diagnostics: NdiDiagnostics) => void) => {
    const handler = (_event: IpcRendererEvent, diagnostics: NdiDiagnostics) => callback(diagnostics);
    ipcRenderer.on(NDI_EVENTS.diagnosticsChanged, handler);
    return () => { ipcRenderer.removeListener(NDI_EVENTS.diagnosticsChanged, handler); };
  },
};

contextBridge.exposeInMainWorld('castApi', api);
