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

export interface MainApi {
  platform: NodeJS.Platform;
  getPathForFile: (file: File) => string;
  getInlineWindowMenuItems: () => Promise<InlineWindowMenuItem[]>;
  popupInlineWindowMenu: (menuId: string, x: number, y: number) => Promise<void>;
  getSnapshot: () => Promise<AppSnapshot>;
  chooseDeckBundleExportPath: (suggestedName: string) => Promise<string | null>;
  chooseDeckBundleImportPath: () => Promise<string | null>;
  chooseImportReplacementMediaPath: () => Promise<string | null>;
  exportDeckBundle: (itemIds: Id[], filePath: string) => Promise<{ filePath: string; itemCount: number }>;
  inspectImportBundle: (filePath: string) => Promise<DeckBundleInspection>;
  finalizeImportBundle: (filePath: string, decisions: DeckBundleBrokenReferenceDecision[]) => Promise<AppSnapshot>;
  createLibrary: (name: string) => Promise<AppSnapshot>;
  createPlaylist: (libraryId: Id, name: string) => Promise<AppSnapshot>;
  createPlaylistSegment: (playlistId: Id, name: string) => Promise<AppSnapshot>;
  renamePlaylistSegment: (id: Id, name: string) => Promise<AppSnapshot>;
  setPlaylistSegmentColor: (id: Id, colorKey: string | null) => Promise<AppSnapshot>;
  movePlaylist: (id: Id, direction: 'up' | 'down') => Promise<AppSnapshot>;
  addDeckItemToSegment: (segmentId: Id, itemId: Id) => Promise<AppSnapshot>;
  moveDeckItemToSegment: (playlistId: Id, itemId: Id, segmentId: Id | null) => Promise<AppSnapshot>;
  movePlaylistEntryToSegment: (entryId: Id, segmentId: Id | null) => Promise<AppSnapshot>;
  moveDeckItem: (id: Id, direction: 'up' | 'down') => Promise<AppSnapshot>;
  createPresentation: (title: string) => Promise<AppSnapshot>;
  createLyric: (title: string) => Promise<AppSnapshot>;
  createSlide: (input: SlideCreateInput) => Promise<AppSnapshot>;
  duplicateSlide: (slideId: Id) => Promise<AppSnapshot>;
  deleteSlide: (slideId: Id) => Promise<AppSnapshot>;
  updateSlideNotes: (input: SlideNotesUpdateInput) => Promise<AppSnapshot>;
  setSlideOrder: (input: SlideOrderUpdateInput) => Promise<AppSnapshot>;
  createElement: (input: ElementCreateInput) => Promise<AppSnapshot>;
  createElementsBatch: (inputs: ElementCreateInput[]) => Promise<AppSnapshot>;
  updateElement: (input: ElementUpdateInput) => Promise<AppSnapshot>;
  updateElementsBatch: (inputs: ElementUpdateInput[]) => Promise<AppSnapshot>;
  deleteElement: (id: Id) => Promise<AppSnapshot>;
  deleteElementsBatch: (ids: Id[]) => Promise<AppSnapshot>;
  createMediaAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AppSnapshot>;
  deleteMediaAsset: (id: Id) => Promise<AppSnapshot>;
  updateMediaAssetSrc: (id: Id, src: string) => Promise<AppSnapshot>;
  createOverlay: (overlay: OverlayCreateInput) => Promise<AppSnapshot>;
  updateOverlay: (input: OverlayUpdateInput) => Promise<AppSnapshot>;
  setOverlayEnabled: (overlayId: Id, enabled: boolean) => Promise<AppSnapshot>;
  deleteOverlay: (overlayId: Id) => Promise<AppSnapshot>;
  createTemplate: (input: TemplateCreateInput) => Promise<AppSnapshot>;
  updateTemplate: (input: TemplateUpdateInput) => Promise<AppSnapshot>;
  deleteTemplate: (templateId: Id) => Promise<AppSnapshot>;
  applyTemplateToDeckItem: (templateId: Id, itemId: Id) => Promise<AppSnapshot>;
  detachTemplateFromDeckItem: (itemId: Id) => Promise<AppSnapshot>;
  applyTemplateToOverlay: (templateId: Id, overlayId: Id) => Promise<AppSnapshot>;
  renameLibrary: (id: Id, name: string) => Promise<AppSnapshot>;
  renamePlaylist: (id: Id, name: string) => Promise<AppSnapshot>;
  renamePresentation: (id: Id, title: string) => Promise<AppSnapshot>;
  renameLyric: (id: Id, title: string) => Promise<AppSnapshot>;
  deleteLibrary: (id: Id) => Promise<AppSnapshot>;
  deletePlaylist: (id: Id) => Promise<AppSnapshot>;
  deletePlaylistSegment: (id: Id) => Promise<AppSnapshot>;
  deletePresentation: (id: Id) => Promise<AppSnapshot>;
  deleteLyric: (id: Id) => Promise<AppSnapshot>;
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
  moveDeckItem: 'cast:moveDeckItem',
  createPresentation: 'cast:createPresentation',
  createLyric: 'cast:createLyric',
  createSlide: 'cast:createSlide',
  duplicateSlide: 'cast:duplicateSlide',
  deleteSlide: 'cast:deleteSlide',
  updateSlideNotes: 'cast:updateSlideNotes',
  setSlideOrder: 'cast:setSlideOrder',
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
