import type { Id, MediaAsset, Slide, SlideElement } from '@core/types';
import type { CanvasViewMode, ShortcutItem, SlideVisualState } from '../types/ui';
import { LAYER_ORDER } from '../types/ui';

export const SHORTCUTS: ShortcutItem[] = [
  { keys: 'Arrow Right', action: 'Next live slide' },
  { keys: 'Arrow Left', action: 'Previous live slide' },
  { keys: '1-9', action: 'Take slide by index' },
  { keys: 'Enter / Space', action: 'Take selected slide' },
  { keys: 'Delete / Backspace', action: 'Delete selected element' },
  { keys: 'Alt + 1..3', action: 'Switch canvas view' },
];

export const CANVAS_VIEW_LABELS: Record<CanvasViewMode, string> = {
  single: 'Single',
  grid: 'Grid',
  outline: 'Outline',
};

export function sortSlides(slides: Slide[]): Slide[] {
  return slides.slice().sort((a, b) => a.order - b.order);
}

export function sortElements(elements: SlideElement[]): SlideElement[] {
  return elements.slice().sort((a, b) => {
    const layerDiff = LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer];
    if (layerDiff !== 0) return layerDiff;
    return a.zIndex - b.zIndex;
  });
}

export function compactText(value: string, maxLength: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1)}\u2026`;
}

export interface SlideTextDetails {
  textElement: SlideElement | null;
  text: string;
  primaryLine: string;
  secondaryLine: string;
}

export function slideTextDetails(elements: SlideElement[]): SlideTextDetails {
  const textElement = elements.find((el) => el.type === 'text' && 'text' in el.payload) ?? null;
  if (!textElement || !('text' in textElement.payload)) {
    return { textElement: null, text: '', primaryLine: 'No text content', secondaryLine: '' };
  }

  const raw = String(textElement.payload.text ?? '');
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const primaryLine = lines[0] ?? 'No text content';
  const secondaryLine = lines.slice(1).join(' ');
  return { textElement, text: raw, primaryLine, secondaryLine };
}

export function slideTextPreview(elements: SlideElement[]): string {
  const details = slideTextDetails(elements);
  if (!details.text) return details.primaryLine;
  return compactText(details.text, 72);
}

export function getSlideVisualState(index: number, liveSlideIndex: number, currentSlideIndex: number, elements: SlideElement[]): SlideVisualState {
  if (index === liveSlideIndex) return 'live';
  if (index === currentSlideIndex) return 'selected';
  if (elements.length === 0) return 'warning';
  return 'queued';
}

export function replacePrimaryLine(text: string, nextPrimary: string): string {
  const trimmedPrimary = nextPrimary.trim();
  if (!trimmedPrimary) return text;

  const lines = text.split('\n');
  if (lines.length === 0) return trimmedPrimary;
  if (lines.length === 1) return trimmedPrimary;
  return [trimmedPrimary, ...lines.slice(1)].join('\n');
}

export function typeFromFile(file: File): MediaAsset['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'animation';
}

export function fileSrc(file: File): string {
  const fileWithPath = file as File & { path?: string };
  if (fileWithPath.path) return `cast-media://${encodeURIComponent(fileWithPath.path)}`;
  console.warn('[fileSrc] File.path unavailable, blob URL will not persist');
  return URL.createObjectURL(file);
}

export function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getOverlayDefaults(libraryId: Id) {
  return {
    libraryId,
    name: 'Lower Third',
    type: 'text' as const,
    x: 180,
    y: 930,
    width: 1560,
    height: 120,
    opacity: 1,
    zIndex: 1000,
    payload: {
      text: 'LIVE \u2022 CAST INTERFACE',
      fontFamily: 'Avenir Next',
      fontSize: 52,
      color: '#FFFFFF',
      alignment: 'left' as const,
      weight: '700',
    },
    animation: { kind: 'fade' as const, durationMs: 2500 },
  };
}
