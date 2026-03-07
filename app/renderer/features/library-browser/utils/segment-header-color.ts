export const SEGMENT_COLOR_OPTIONS = [
  { key: 'red', label: 'Red', swatch: '#dc2626', background: '#3f1f22' },
  { key: 'orange', label: 'Orange', swatch: '#f97316', background: '#3f2a1f' },
  { key: 'amber', label: 'Amber', swatch: '#fbbf24', background: '#3b301f' },
  { key: 'blue', label: 'Blue', swatch: '#3b82f6', background: '#232a3f' },
  { key: 'indigo', label: 'Indigo', swatch: '#4f46e5', background: '#27253f' },
  { key: 'pink', label: 'Pink', swatch: '#ec4899', background: '#3f1f33' },
  { key: 'green', label: 'Green', swatch: '#22c55e', background: '#253329' },
  { key: 'gray', label: 'Gray', swatch: '#6b7280', background: '#2f2f34' },
  { key: 'crimson', label: 'Crimson', swatch: '#7f1d1d', background: '#3b1c22' },
  { key: 'brown', label: 'Brown', swatch: '#78350f', background: '#3a2a20' },
  { key: 'ochre', label: 'Ochre', swatch: '#854d0e', background: '#3a2f20' },
  { key: 'navy', label: 'Navy', swatch: '#1d4ed8', background: '#1f2638' },
  { key: 'violet', label: 'Violet', swatch: '#4338ca', background: '#28233f' },
  { key: 'magenta', label: 'Magenta', swatch: '#9d174d', background: '#3a2234' },
  { key: 'teal', label: 'Teal', swatch: '#0f766e', background: '#1f3232' },
  { key: 'slate', label: 'Slate', swatch: '#4b5563', background: '#2d3138' }
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

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixRgb(base: Rgb, other: Rgb, amount: number): Rgb {
  const mixChannel = (baseChannel: number, otherChannel: number) =>
    Math.round(baseChannel + (otherChannel - baseChannel) * amount);

  return {
    r: mixChannel(base.r, other.r),
    g: mixChannel(base.g, other.g),
    b: mixChannel(base.b, other.b)
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const normalize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return (0.2126 * normalize(r)) + (0.7152 * normalize(g)) + (0.0722 * normalize(b));
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getAccessibleTintedTextColor(backgroundHex: string, swatchHex: string): string {
  const background = hexToRgb(backgroundHex);
  const swatch = hexToRgb(swatchHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const candidates = [
    mixRgb(swatch, white, 0.82),
    mixRgb(swatch, white, 0.72),
    mixRgb(swatch, white, 0.62),
    mixRgb(swatch, white, 0.52),
    mixRgb(swatch, white, 0.42),
    mixRgb(swatch, black, 0.2),
    white
  ];

  const accessibleCandidate = candidates.find((candidate) => contrastRatio(background, candidate) >= 4.5);
  if (accessibleCandidate) return rgbToHex(accessibleCandidate);

  let bestCandidate = candidates[0];
  let bestContrast = contrastRatio(background, bestCandidate);
  for (const candidate of candidates.slice(1)) {
    const candidateContrast = contrastRatio(background, candidate);
    if (candidateContrast > bestContrast) {
      bestCandidate = candidate;
      bestContrast = candidateContrast;
    }
  }

  return rgbToHex(bestCandidate);
}

export function getSegmentHeaderColors(segmentId: string, colorKey: string | null): SegmentHeaderColors {
  const fallbackIndex = hashSegmentId(segmentId) % DEFAULT_SEGMENT_COLORS.length;
  const fallbackOption = DEFAULT_SEGMENT_COLORS[fallbackIndex];
  const selectedOption = colorKey ? SEGMENT_COLOR_BY_KEY.get(colorKey) : null;
  const activeOption = selectedOption ?? fallbackOption;

  if (colorKey) {
    const explicitOption = SEGMENT_COLOR_BY_KEY.get(colorKey);
    if (explicitOption) {
      return {
        backgroundColor: explicitOption.background,
        textColor: getAccessibleTintedTextColor(explicitOption.background, explicitOption.swatch)
      };
    }
  }

  return {
    backgroundColor: activeOption.background,
    textColor: getAccessibleTintedTextColor(activeOption.background, activeOption.swatch)
  };
}
