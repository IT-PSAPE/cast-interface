export const SEGMENT_COLOR_OPTIONS = [
  { key: 'red', label: 'Red', swatch: '#dc2626' },
  { key: 'orange', label: 'Orange', swatch: '#f97316' },
  { key: 'amber', label: 'Amber', swatch: '#fbbf24' },
  { key: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { key: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { key: 'pink', label: 'Pink', swatch: '#ec4899' },
  { key: 'green', label: 'Green', swatch: '#22c55e' },
  { key: 'gray', label: 'Gray', swatch: '#6b7280' },
  { key: 'crimson', label: 'Crimson', swatch: '#7f1d1d' },
  { key: 'brown', label: 'Brown', swatch: '#78350f' },
  { key: 'ochre', label: 'Ochre', swatch: '#854d0e' },
  { key: 'navy', label: 'Navy', swatch: '#1d4ed8' },
  { key: 'violet', label: 'Violet', swatch: '#4338ca' },
  { key: 'magenta', label: 'Magenta', swatch: '#9d174d' },
  { key: 'teal', label: 'Teal', swatch: '#0f766e' },
  { key: 'slate', label: 'Slate', swatch: '#4b5563' }
] as const;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface SegmentHeaderColors {
  backgroundColor: string;
  textColor: string;
}

const DEFAULT_SEGMENT_COLORS = SEGMENT_COLOR_OPTIONS.slice(0, 8);
const SEGMENT_COLOR_BY_KEY = new Map<string, (typeof SEGMENT_COLOR_OPTIONS)[number]>(
  SEGMENT_COLOR_OPTIONS.map((option) => [option.key, option] as const)
);

function hashSegmentId(segmentId: string): number {
  let hash = 0;
  for (let index = 0; index < segmentId.length; index += 1) {
    hash = (hash * 31 + segmentId.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function hexToRgb(hex: string): Rgb {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3
    ? `${sanitized[0]}${sanitized[0]}${sanitized[1]}${sanitized[1]}${sanitized[2]}${sanitized[2]}`
    : sanitized;
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getSegmentHeaderColors(segmentId: string, colorKey: string | null): SegmentHeaderColors {
  const fallbackIndex = hashSegmentId(segmentId) % DEFAULT_SEGMENT_COLORS.length;
  const fallbackOption = DEFAULT_SEGMENT_COLORS[fallbackIndex];
  const activeOption = colorKey ? SEGMENT_COLOR_BY_KEY.get(colorKey) ?? fallbackOption : fallbackOption;

  return {
    backgroundColor: withAlpha(activeOption.swatch, 0.18),
    textColor: `color-mix(in srgb, var(--color-text-primary) 88%, ${activeOption.swatch})`
  };
}
