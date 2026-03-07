export type Id = string;

export interface Library {
  id: Id;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: Id;
  libraryId: Id;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSegment {
  id: Id;
  playlistId: Id;
  name: string;
  colorKey: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistEntry {
  id: Id;
  segmentId: Id;
  presentationId: Id;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type PresentationKind = 'canvas' | 'lyrics';

export interface Presentation {
  id: Id;
  libraryId: Id;
  title: string;
  kind: PresentationKind;
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: Id;
  presentationId: Id;
  width: number;
  height: number;
  notes: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type SlideElementType = 'text' | 'image' | 'video' | 'shape' | 'group';

export interface SlideElementBase {
  id: Id;
  slideId: Id;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  layer: 'background' | 'media' | 'content';
  createdAt: string;
  updatedAt: string;
}

export type TextHorizontalAlign = CanvasTextAlign | 'justify';
export type TextVerticalAlign = 'top' | 'middle' | 'bottom';
export type TextCaseTransform = 'none' | 'uppercase' | 'sentence';

export interface ElementVisualPayload {
  visible?: boolean;
  locked?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  fillEnabled?: boolean;
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface TextElementPayload extends ElementVisualPayload {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: TextHorizontalAlign;
  verticalAlign?: TextVerticalAlign;
  caseTransform?: TextCaseTransform;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  lineHeight?: number;
  weight?: string;
}

export interface ImageElementPayload extends ElementVisualPayload {
  src: string;
}

export interface VideoElementPayload extends ElementVisualPayload {
  src: string;
  autoplay: boolean;
  loop: boolean;
  muted?: boolean;
}

export interface ShapeElementPayload extends ElementVisualPayload {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

export interface GroupElementPayload extends ElementVisualPayload {
  children: SlideElement[];
}

export type SlideElementPayload =
  | TextElementPayload
  | ImageElementPayload
  | VideoElementPayload
  | ShapeElementPayload
  | GroupElementPayload;

export interface SlideElement extends SlideElementBase {
  payload: SlideElementPayload;
}

export type MediaAssetType = 'image' | 'video' | 'audio' | 'animation';

export interface MediaAsset {
  id: Id;
  libraryId: Id;
  name: string;
  type: MediaAssetType;
  src: string;
  createdAt: string;
  updatedAt: string;
}

export type OverlayType = 'image' | 'shape' | 'text' | 'video';

export interface OverlayAnimation {
  kind: 'none' | 'pulse' | 'fade';
  durationMs: number;
}

export interface Overlay {
  id: Id;
  libraryId: Id;
  name: string;
  type: OverlayType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
  enabled: boolean;
  payload: SlideElementPayload;
  elements: SlideElement[];
  animation: OverlayAnimation;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTree {
  playlist: Playlist;
  segments: Array<{
    segment: PlaylistSegment;
    entries: Array<{
      entry: PlaylistEntry;
      presentation: Presentation;
    }>;
  }>;
}

export interface LibraryBundle {
  library: Library;
  presentations: Presentation[];
  slides: Slide[];
  slideElements: SlideElement[];
  playlists: PlaylistTree[];
  mediaAssets: MediaAsset[];
  overlays: Overlay[];
}

export interface AppSnapshot {
  libraries: Library[];
  bundles: LibraryBundle[];
}

export interface SlideFrame {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  timestamp: number;
}

export interface PlaybackState {
  playlistId: Id | null;
  presentationId: Id | null;
  slideIndex: number;
}

export type SlideBrowserMode = 'library' | 'playlist' | 'presentation' | 'slide-editor';

export interface SlideCreateInput {
  presentationId: Id;
  width?: number;
  height?: number;
}

export interface SlideNotesUpdateInput {
  slideId: Id;
  notes: string;
}

export interface ElementCreateInput {
  id?: Id;
  slideId: Id;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  layer?: SlideElementBase['layer'];
  payload: SlideElementPayload;
}

export interface ElementUpdateInput {
  id: Id;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  layer?: SlideElementBase['layer'];
  payload?: SlideElementPayload;
}

export type NdiOutputName = 'audience';

export interface NdiOutputState {
  audience: boolean;
}

export interface OverlayCreateInput {
  libraryId: Id;
  name: string;
  elements?: SlideElement[];
  animation?: OverlayAnimation;
}

export interface OverlayUpdateInput {
  id: Id;
  name?: string;
  elements?: SlideElement[];
  animation?: OverlayAnimation;
}
