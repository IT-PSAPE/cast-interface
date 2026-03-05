import type {
  AppSnapshot,
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
} from './types';

export interface MainApi {
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
  createPresentation: (libraryId: Id, title: string, kind?: PresentationKind) => Promise<AppSnapshot>;
  setPresentationKind: (id: Id, kind: PresentationKind) => Promise<AppSnapshot>;
  createSlide: (input: SlideCreateInput) => Promise<AppSnapshot>;
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
  setOverlayEnabled: (overlayId: Id, enabled: boolean) => Promise<AppSnapshot>;
  renameLibrary: (id: Id, name: string) => Promise<AppSnapshot>;
  renamePlaylist: (id: Id, name: string) => Promise<AppSnapshot>;
  renamePresentation: (id: Id, title: string) => Promise<AppSnapshot>;
  deleteLibrary: (id: Id) => Promise<AppSnapshot>;
  deletePlaylist: (id: Id) => Promise<AppSnapshot>;
  deletePlaylistSegment: (id: Id) => Promise<AppSnapshot>;
  deletePresentation: (id: Id) => Promise<AppSnapshot>;
  sendNdiFrame: (frame: SlideFrame) => Promise<void>;
  connectNdiFramePort: () => MessagePort;
  setNdiOutputEnabled: (name: NdiOutputName, enabled: boolean) => Promise<NdiOutputState>;
  getNdiOutputState: () => Promise<NdiOutputState>;
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
  setPresentationKind: 'cast:setPresentationKind',
  createSlide: 'cast:createSlide',
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
  setOverlayEnabled: 'cast:setOverlayEnabled',
  renameLibrary: 'cast:renameLibrary',
  renamePlaylist: 'cast:renamePlaylist',
  renamePresentation: 'cast:renamePresentation',
  deleteLibrary: 'cast:deleteLibrary',
  deletePlaylist: 'cast:deletePlaylist',
  deletePlaylistSegment: 'cast:deletePlaylistSegment',
  deletePresentation: 'cast:deletePresentation',
  sendNdiFrame: 'cast:sendNdiFrame',
  connectNdiFramePort: 'ndi:connectFramePort',
  setNdiOutputEnabled: 'ndi:setOutputEnabled',
  getNdiOutputState: 'ndi:getOutputState'
} as const;

export const NDI_EVENTS = {
  outputStateChanged: 'ndi:outputStateChanged'
} as const;
