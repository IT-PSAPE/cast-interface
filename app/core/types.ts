export type Id = string;

export interface Library {
  id: Id;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: Id;
  libraryId: Id;
  name: string;
  order: number;
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
  presentationId: Id | null;
  lyricId: Id | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type DeckItemType = 'presentation' | 'lyric';
export type TemplateKind = 'slides' | 'lyrics' | 'overlays';

interface DeckItemBase {
  id: Id;
  title: string;
  templateId?: Id | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Presentation extends DeckItemBase {
  type: 'presentation';
}

export interface Lyric extends DeckItemBase {
  type: 'lyric';
}

export type DeckItem = Presentation | Lyric;

export interface Slide {
  id: Id;
  presentationId: Id | null;
  lyricId: Id | null;
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
  order: number;
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

export interface Stage {
  id: Id;
  name: string;
  width: number;
  height: number;
  elements: SlideElement[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeckBundleTemplate {
  id: Id;
  name: string;
  kind: TemplateKind;
  width: number;
  height: number;
  order: number;
  elements: SlideElement[];
}

export interface DeckBundleSlide {
  id: Id;
  width: number;
  height: number;
  notes: string;
  order: number;
  elements: SlideElement[];
}

export interface DeckBundleItem {
  id: Id;
  type: DeckItemType;
  title: string;
  templateId: Id | null;
  order: number;
  slides: DeckBundleSlide[];
}

export interface DeckBundleMediaReference {
  source: string;
  elementTypes: Array<'image' | 'video'>;
  occurrenceCount: number;
}

export interface DeckBundleManifest {
  format: 'cast-deck-bundle';
  version: 1;
  exportedAt: string;
  items: DeckBundleItem[];
  templates: DeckBundleTemplate[];
  mediaReferences: DeckBundleMediaReference[];
}

export interface DeckBundleInspectionItem {
  id: Id;
  title: string;
  type: DeckItemType;
  slideCount: number;
  templateId: Id | null;
}

export interface DeckBundleInspectionTemplate {
  id: Id;
  name: string;
  kind: TemplateKind;
}

export interface BrokenDeckBundleReference {
  source: string;
  elementTypes: Array<'image' | 'video'>;
  occurrenceCount: number;
  itemTitles: string[];
  templateNames: string[];
}

export interface DeckBundleInspection {
  exportedAt: string;
  itemCount: number;
  templateCount: number;
  mediaReferenceCount: number;
  items: DeckBundleInspectionItem[];
  templates: DeckBundleInspectionTemplate[];
  mediaReferences: DeckBundleMediaReference[];
  brokenReferences: BrokenDeckBundleReference[];
}

export type DeckBundleBrokenReferenceAction = 'replace' | 'remove' | 'leave';

export interface DeckBundleBrokenReferenceDecision {
  source: string;
  action: DeckBundleBrokenReferenceAction;
  replacementPath?: string;
}

export interface PlaylistTree {
  playlist: Playlist;
  segments: Array<{
    segment: PlaylistSegment;
    entries: Array<{
      entry: PlaylistEntry;
      item: DeckItem;
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
  lyrics: Lyric[];
  slides: Slide[];
  slideElements: SlideElement[];
  mediaAssets: MediaAsset[];
  overlays: Overlay[];
  templates: Template[];
  stages: Stage[];
}

export interface PlaybackState {
  playlistId: Id | null;
  deckItemId: Id | null;
  slideIndex: number;
}

export type SlideBrowserMode = 'library' | 'playlist' | 'deck' | 'deck-editor';

export interface SlideCreateInput {
  presentationId?: Id | null;
  lyricId?: Id | null;
  width?: number;
  height?: number;
}

export interface SlideNotesUpdateInput {
  slideId: Id;
  notes: string;
}

export interface SlideOrderUpdateInput {
  slideId: Id;
  newOrder: number;
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

export type NdiOutputName = 'audience' | 'stage';

export interface NdiOutputState {
  audience: boolean;
  stage: boolean;
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

export interface StageCreateInput {
  name: string;
  width?: number;
  height?: number;
  elements?: SlideElement[];
}

export interface StageUpdateInput {
  id: Id;
  name?: string;
  width?: number;
  height?: number;
  elements?: SlideElement[];
}
