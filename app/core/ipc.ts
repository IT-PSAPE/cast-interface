import type {
  AppSnapshot,
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  MediaAsset,
  NdiDiagnostics,
  NdiOutputConfig,
  NdiOutputConfigMap,
  PresentationKind,
  NdiOutputName,
  NdiOutputState,
  OverlayCreateInput,
  OverlayUpdateInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  SlideCreateInput,
  SlideNotesUpdateInput
} from './types';

export interface MainApi {
  getPathForFile: (file: File) => string;
  getSnapshot: () => Promise<AppSnapshot>;
  createLibrary: (name: string) => Promise<AppSnapshot>;
  createPlaylist: (libraryId: Id, name: string) => Promise<AppSnapshot>;
  createPlaylistSegment: (playlistId: Id, name: string) => Promise<AppSnapshot>;
  renamePlaylistSegment: (id: Id, name: string) => Promise<AppSnapshot>;
  setPlaylistSegmentColor: (id: Id, colorKey: string | null) => Promise<AppSnapshot>;
  movePlaylist: (id: Id, direction: 'up' | 'down') => Promise<AppSnapshot>;
  addPresentationToSegment: (segmentId: Id, presentationId: Id) => Promise<AppSnapshot>;
  movePresentationToSegment: (playlistId: Id, presentationId: Id, segmentId: Id | null) => Promise<AppSnapshot>;
  movePresentation: (id: Id, direction: 'up' | 'down') => Promise<AppSnapshot>;
  createPresentation: (title: string, kind?: PresentationKind) => Promise<AppSnapshot>;
  createLyric: (title: string) => Promise<AppSnapshot>;
  setPresentationKind: (id: Id, kind: PresentationKind) => Promise<AppSnapshot>;
  createSlide: (input: SlideCreateInput) => Promise<AppSnapshot>;
  updateSlideNotes: (input: SlideNotesUpdateInput) => Promise<AppSnapshot>;
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
  applyTemplateToPresentation: (templateId: Id, presentationId: Id) => Promise<AppSnapshot>;
  resetPresentationToTemplate: (presentationId: Id) => Promise<AppSnapshot>;
  applyTemplateToOverlay: (templateId: Id, overlayId: Id) => Promise<AppSnapshot>;
  renameLibrary: (id: Id, name: string) => Promise<AppSnapshot>;
  renamePlaylist: (id: Id, name: string) => Promise<AppSnapshot>;
  renamePresentation: (id: Id, title: string) => Promise<AppSnapshot>;
  deleteLibrary: (id: Id) => Promise<AppSnapshot>;
  deletePlaylist: (id: Id) => Promise<AppSnapshot>;
  deletePlaylistSegment: (id: Id) => Promise<AppSnapshot>;
  deletePresentation: (id: Id) => Promise<AppSnapshot>;
  setNdiOutputEnabled: (name: NdiOutputName, enabled: boolean) => Promise<NdiOutputState>;
  getNdiOutputState: () => Promise<NdiOutputState>;
  getNdiOutputConfigs: () => Promise<NdiOutputConfigMap>;
  updateNdiOutputConfig: (name: NdiOutputName, config: Partial<NdiOutputConfig>) => Promise<NdiOutputConfigMap>;
  getNdiDiagnostics: () => Promise<NdiDiagnostics>;
  sendNdiFrame: (buffer: ArrayBuffer, width: number, height: number) => void;
  onNdiOutputStateChanged: (callback: (state: NdiOutputState) => void) => () => void;
  onNdiDiagnosticsChanged: (callback: (diagnostics: NdiDiagnostics) => void) => () => void;
}

export const IPC = {
  getSnapshot: 'cast:getSnapshot',
  createLibrary: 'cast:createLibrary',
  createPlaylist: 'cast:createPlaylist',
  createPlaylistSegment: 'cast:createPlaylistSegment',
  renamePlaylistSegment: 'cast:renamePlaylistSegment',
  setPlaylistSegmentColor: 'cast:setPlaylistSegmentColor',
  movePlaylist: 'cast:movePlaylist',
  addPresentationToSegment: 'cast:addPresentationToSegment',
  movePresentationToSegment: 'cast:movePresentationToSegment',
  movePresentation: 'cast:movePresentation',
  createPresentation: 'cast:createPresentation',
  createLyric: 'cast:createLyric',
  setPresentationKind: 'cast:setPresentationKind',
  createSlide: 'cast:createSlide',
  updateSlideNotes: 'cast:updateSlideNotes',
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
  applyTemplateToPresentation: 'cast:applyTemplateToPresentation',
  resetPresentationToTemplate: 'cast:resetPresentationToTemplate',
  applyTemplateToOverlay: 'cast:applyTemplateToOverlay',
  renameLibrary: 'cast:renameLibrary',
  renamePlaylist: 'cast:renamePlaylist',
  renamePresentation: 'cast:renamePresentation',
  deleteLibrary: 'cast:deleteLibrary',
  deletePlaylist: 'cast:deletePlaylist',
  deletePlaylistSegment: 'cast:deletePlaylistSegment',
  deletePresentation: 'cast:deletePresentation',
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
