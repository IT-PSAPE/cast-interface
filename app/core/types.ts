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
export type PresentationEntityType = 'presentation' | 'lyric';
export type TemplateKind = 'slides' | 'lyrics' | 'overlays';

interface PresentationBase {
  id: Id;
  title: string;
  templateId?: Id | null;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasPresentation extends PresentationBase {
  entityType: 'presentation';
  kind: 'canvas';
}

export interface Lyric extends PresentationBase {
  entityType: 'lyric';
  kind: 'lyrics';
}

export type Presentation = CanvasPresentation | Lyric;

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
export type StrokePosition = 'inside' | 'center' | 'outside';

export interface ElementVisualPayload {
  visible?: boolean;
  locked?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  fillEnabled?: boolean;
  fillColor?: string;
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  strokePosition?: StrokePosition;
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
  textStrokeEnabled?: boolean;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textStrokePosition?: StrokePosition;
  textShadowEnabled?: boolean;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
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
  name: string;
  type: MediaAssetType;
  src: string;
  createdAt: string;
  updatedAt: string;
}

export type OverlayType = 'image' | 'shape' | 'text' | 'video';

export interface OverlayAnimation {
  kind: 'none' | 'dissolve' | 'fade' | 'pulse';
  durationMs: number;
  autoClearDurationMs?: number | null;
}

export interface Overlay {
  id: Id;
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

export interface Template {
  id: Id;
  name: string;
  kind: TemplateKind;
  width: number;
  height: number;
  elements: SlideElement[];
  order: number;
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

export interface LibraryPlaylistBundle {
  library: Library;
  playlists: PlaylistTree[];
}

export interface AppSnapshot {
  libraries: Library[];
  libraryBundles: LibraryPlaylistBundle[];
  presentations: Presentation[];
  slides: Slide[];
  slideElements: SlideElement[];
  mediaAssets: MediaAsset[];
  overlays: Overlay[];
  templates: Template[];
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

export type NdiSourceStatus = 'idle' | 'live';

export interface NdiOutputConfig {
  senderName: string;
  withAlpha: boolean;
}

export type NdiOutputConfigMap = Record<NdiOutputName, NdiOutputConfig>;

export interface NdiActiveSenderDiagnostics {
  senderName: string;
  width: number;
  height: number;
  withAlpha: boolean;
}

export interface NdiDiagnostics {
  outputState: NdiOutputState;
  outputConfig: NdiOutputConfig;
  runtimeLoaded: boolean;
  runtimePath: string | null;
  activeSender: NdiActiveSenderDiagnostics | null;
  sourceStatus: NdiSourceStatus;
  lastError: string | null;
}

export interface OverlayCreateInput {
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

export interface TemplateCreateInput {
  name: string;
  kind: TemplateKind;
  width?: number;
  height?: number;
  elements?: SlideElement[];
}

export interface TemplateUpdateInput {
  id: Id;
  name?: string;
  kind?: TemplateKind;
  width?: number;
  height?: number;
  elements?: SlideElement[];
}
