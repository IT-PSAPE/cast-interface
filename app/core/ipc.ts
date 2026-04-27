import type {
  AppSnapshot,
  DeckBundleBrokenReferenceDecision,
  DeckBundleInspection,
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
} from './types';
import type { SnapshotPatch } from './snapshot-patch';

export interface MainApi {
  platform: NodeJS.Platform;
  getPathForFile: (file: File) => string;
  getInlineWindowMenuItems: () => Promise<InlineWindowMenuItem[]>;
  popupInlineWindowMenu: (menuId: string, x: number, y: number) => Promise<void>;
  getSnapshot: () => Promise<AppSnapshot>;
  restoreFromSnapshot: (snapshot: AppSnapshot) => Promise<AppSnapshot>;
  chooseDeckBundleExportPath: (suggestedName: string) => Promise<string | null>;
  chooseDeckBundleImportPath: () => Promise<string | null>;
  chooseImportReplacementMediaPath: () => Promise<string | null>;
  exportDeckBundle: (itemIds: Id[], filePath: string) => Promise<{ filePath: string; itemCount: number }>;
  inspectImportBundle: (filePath: string) => Promise<DeckBundleInspection>;
  finalizeImportBundle: (filePath: string, decisions: DeckBundleBrokenReferenceDecision[]) => Promise<AppSnapshot>;
  createLibrary: (name: string) => Promise<SnapshotPatch>;
  createPlaylist: (libraryId: Id, name: string) => Promise<SnapshotPatch>;
  createPlaylistSegment: (playlistId: Id, name: string) => Promise<SnapshotPatch>;
  renamePlaylistSegment: (id: Id, name: string) => Promise<SnapshotPatch>;
  setPlaylistSegmentColor: (id: Id, colorKey: string | null) => Promise<SnapshotPatch>;
  movePlaylist: (id: Id, direction: 'up' | 'down') => Promise<SnapshotPatch>;
  addDeckItemToSegment: (segmentId: Id, itemId: Id) => Promise<SnapshotPatch>;
  moveDeckItemToSegment: (playlistId: Id, itemId: Id, segmentId: Id | null) => Promise<SnapshotPatch>;
  movePlaylistEntryToSegment: (entryId: Id, segmentId: Id | null) => Promise<SnapshotPatch>;
  moveDeckItem: (id: Id, direction: 'up' | 'down') => Promise<SnapshotPatch>;
  createPresentation: (title: string) => Promise<SnapshotPatch>;
  createLyric: (title: string) => Promise<SnapshotPatch>;
  createSlide: (input: SlideCreateInput) => Promise<SnapshotPatch>;
  duplicateSlide: (slideId: Id) => Promise<SnapshotPatch>;
  deleteSlide: (slideId: Id) => Promise<SnapshotPatch>;
  updateSlideNotes: (input: SlideNotesUpdateInput) => Promise<SnapshotPatch>;
  movePlaylistEntry: (entryId: Id, direction: 'up' | 'down') => Promise<AppSnapshot>;
  setSlideOrder: (input: SlideOrderUpdateInput) => Promise<SnapshotPatch>;
  setLibraryOrder: (libraryId: Id, newOrder: number) => Promise<SnapshotPatch>;
  setPlaylistOrder: (playlistId: Id, newOrder: number) => Promise<SnapshotPatch>;
  setPlaylistSegmentOrder: (segmentId: Id, newOrder: number) => Promise<SnapshotPatch>;
  movePlaylistEntryTo: (entryId: Id, segmentId: Id, newOrder: number) => Promise<SnapshotPatch>;
  createElement: (input: ElementCreateInput) => Promise<SnapshotPatch>;
  createElementsBatch: (inputs: ElementCreateInput[]) => Promise<SnapshotPatch>;
  updateElement: (input: ElementUpdateInput) => Promise<SnapshotPatch>;
  updateElementsBatch: (inputs: ElementUpdateInput[]) => Promise<SnapshotPatch>;
  deleteElement: (id: Id) => Promise<SnapshotPatch>;
  deleteElementsBatch: (ids: Id[]) => Promise<SnapshotPatch>;
  createMediaAsset: (asset: Omit<MediaAsset, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<SnapshotPatch>;
  deleteMediaAsset: (id: Id) => Promise<SnapshotPatch>;
  updateMediaAssetSrc: (id: Id, src: string) => Promise<SnapshotPatch>;
  createOverlay: (overlay: OverlayCreateInput) => Promise<SnapshotPatch>;
  updateOverlay: (input: OverlayUpdateInput) => Promise<SnapshotPatch>;
  setOverlayEnabled: (overlayId: Id, enabled: boolean) => Promise<SnapshotPatch>;
  deleteOverlay: (overlayId: Id) => Promise<SnapshotPatch>;
  createTemplate: (input: TemplateCreateInput) => Promise<SnapshotPatch>;
  updateTemplate: (input: TemplateUpdateInput) => Promise<SnapshotPatch>;
  deleteTemplate: (templateId: Id) => Promise<SnapshotPatch>;
  applyTemplateToDeckItem: (templateId: Id, itemId: Id) => Promise<SnapshotPatch>;
  detachTemplateFromDeckItem: (itemId: Id) => Promise<SnapshotPatch>;
  syncTemplateToLinkedDeckItems: (templateId: Id) => Promise<SnapshotPatch>;
  applyTemplateToOverlay: (templateId: Id, overlayId: Id) => Promise<SnapshotPatch>;
  renameLibrary: (id: Id, name: string) => Promise<SnapshotPatch>;
  renamePlaylist: (id: Id, name: string) => Promise<SnapshotPatch>;
  renamePresentation: (id: Id, title: string) => Promise<SnapshotPatch>;
  renameLyric: (id: Id, title: string) => Promise<SnapshotPatch>;
  deleteLibrary: (id: Id) => Promise<SnapshotPatch>;
  deletePlaylist: (id: Id) => Promise<SnapshotPatch>;
  deletePlaylistSegment: (id: Id) => Promise<SnapshotPatch>;
  deletePresentation: (id: Id) => Promise<SnapshotPatch>;
  deleteLyric: (id: Id) => Promise<SnapshotPatch>;
  setNdiOutputEnabled: (name: NdiOutputName, enabled: boolean) => Promise<NdiOutputState>;
  getNdiOutputState: () => Promise<NdiOutputState>;
  getNdiOutputConfigs: () => Promise<NdiOutputConfigMap>;
  updateNdiOutputConfig: (name: NdiOutputName, config: Partial<NdiOutputConfig>) => Promise<NdiOutputConfigMap>;
  getNdiDiagnostics: () => Promise<NdiDiagnostics>;
  sendNdiFrame: (buffer: ArrayBuffer, width: number, height: number) => void;
  onNdiOutputStateChanged: (callback: (state: NdiOutputState) => void) => () => void;
  getAudioCoverArt: (src: string) => Promise<string | null>;
  onNdiDiagnosticsChanged: (callback: (diagnostics: NdiDiagnostics) => void) => () => void;
}

export interface InlineWindowMenuItem {
  id: string;
  label: string;
}

export const IPC = {
  getInlineWindowMenuItems: 'cast:getInlineWindowMenuItems',
  popupInlineWindowMenu: 'cast:popupInlineWindowMenu',
  getSnapshot: 'cast:getSnapshot',
  restoreFromSnapshot: 'cast:restoreFromSnapshot',
  chooseDeckBundleExportPath: 'cast:chooseDeckBundleExportPath',
  chooseDeckBundleImportPath: 'cast:chooseDeckBundleImportPath',
  chooseImportReplacementMediaPath: 'cast:chooseImportReplacementMediaPath',
  exportDeckBundle: 'cast:exportDeckBundle',
  inspectImportBundle: 'cast:inspectImportBundle',
  finalizeImportBundle: 'cast:finalizeImportBundle',
  createLibrary: 'cast:createLibrary',
  createPlaylist: 'cast:createPlaylist',
  createPlaylistSegment: 'cast:createPlaylistSegment',
  renamePlaylistSegment: 'cast:renamePlaylistSegment',
  setPlaylistSegmentColor: 'cast:setPlaylistSegmentColor',
  movePlaylist: 'cast:movePlaylist',
  addDeckItemToSegment: 'cast:addDeckItemToSegment',
  moveDeckItemToSegment: 'cast:moveDeckItemToSegment',
  movePlaylistEntryToSegment: 'cast:movePlaylistEntryToSegment',
  movePlaylistEntry: 'cast:movePlaylistEntry',
  moveDeckItem: 'cast:moveDeckItem',
  createPresentation: 'cast:createPresentation',
  createLyric: 'cast:createLyric',
  createSlide: 'cast:createSlide',
  duplicateSlide: 'cast:duplicateSlide',
  deleteSlide: 'cast:deleteSlide',
  updateSlideNotes: 'cast:updateSlideNotes',
  setSlideOrder: 'cast:setSlideOrder',
  setLibraryOrder: 'cast:setLibraryOrder',
  setPlaylistOrder: 'cast:setPlaylistOrder',
  setPlaylistSegmentOrder: 'cast:setPlaylistSegmentOrder',
  movePlaylistEntryTo: 'cast:movePlaylistEntryTo',
  createElement: 'cast:createElement',
  createElementsBatch: 'cast:createElementsBatch',
  updateElement: 'cast:updateElement',
  updateElementsBatch: 'cast:updateElementsBatch',
  deleteElement: 'cast:deleteElement',
  deleteElementsBatch: 'cast:deleteElementsBatch',
  createMediaAsset: 'cast:createMediaAsset',
  deleteMediaAsset: 'cast:deleteMediaAsset',
  updateMediaAssetSrc: 'cast:updateMediaAssetSrc',
  createOverlay: 'cast:createOverlay',
  updateOverlay: 'cast:updateOverlay',
  setOverlayEnabled: 'cast:setOverlayEnabled',
  deleteOverlay: 'cast:deleteOverlay',
  createTemplate: 'cast:createTemplate',
  updateTemplate: 'cast:updateTemplate',
  deleteTemplate: 'cast:deleteTemplate',
  applyTemplateToDeckItem: 'cast:applyTemplateToDeckItem',
  detachTemplateFromDeckItem: 'cast:detachTemplateFromDeckItem',
  syncTemplateToLinkedDeckItems: 'cast:syncTemplateToLinkedDeckItems',
  applyTemplateToOverlay: 'cast:applyTemplateToOverlay',
  renameLibrary: 'cast:renameLibrary',
  renamePlaylist: 'cast:renamePlaylist',
  renamePresentation: 'cast:renamePresentation',
  renameLyric: 'cast:renameLyric',
  deleteLibrary: 'cast:deleteLibrary',
  deletePlaylist: 'cast:deletePlaylist',
  deletePlaylistSegment: 'cast:deletePlaylistSegment',
  deletePresentation: 'cast:deletePresentation',
  deleteLyric: 'cast:deleteLyric',
  getAudioCoverArt: 'cast:getAudioCoverArt',
  setNdiOutputEnabled: 'ndi:setOutputEnabled',
  getNdiOutputState: 'ndi:getOutputState',
  getNdiOutputConfigs: 'ndi:getOutputConfigs',
  updateNdiOutputConfig: 'ndi:updateOutputConfig',
  getNdiDiagnostics: 'ndi:getDiagnostics',
  sendNdiFrame: 'ndi:sendFrame',
} as const;

export const NDI_EVENTS = {
  outputStateChanged: 'ndi:outputStateChanged',
  diagnosticsChanged: 'ndi:diagnosticsChanged',
} as const;
