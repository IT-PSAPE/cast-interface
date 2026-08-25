import type { TextElementPayload, TextVerticalAlign } from '@lumacast/composition';

interface MeasureInlineTextHeightInput {
  text: string;
  width: number;
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  fontStyle: string;
  fontFamily: string;
}

export function resolveInlineTextAlign(alignment: TextElementPayload['alignment']): 'left' | 'center' | 'right' | 'justify' {
  if (alignment === 'center') return 'center';
  if (alignment === 'right' || alignment === 'end') return 'right';
  if (alignment === 'justify') return 'justify';
  return 'left';
}

export function measureInlineTextHeight({ text, width, fontSize, lineHeight, fontWeight, fontStyle, fontFamily }: MeasureInlineTextHeightInput): number {
  if (typeof document === 'undefined') {
    return fontSize * lineHeight;
  }

  const measureNode = document.createElement('div');
  measureNode.style.position = 'absolute';
  measureNode.style.visibility = 'hidden';
  measureNode.style.pointerEvents = 'none';
  measureNode.style.left = '-99999px';
  measureNode.style.top = '0';
  measureNode.style.width = `${Math.max(width, fontSize)}px`;
  measureNode.style.whiteSpace = 'pre-wrap';
  measureNode.style.wordBreak = 'break-word';
  measureNode.style.overflowWrap = 'anywhere';
  measureNode.style.fontSize = `${fontSize}px`;
  measureNode.style.lineHeight = String(lineHeight);
  measureNode.style.fontWeight = fontWeight;
  measureNode.style.fontStyle = fontStyle;
  measureNode.style.fontFamily = fontFamily;
  measureNode.textContent = text.length > 0 ? text : ' ';
  document.body.appendChild(measureNode);
  const height = measureNode.getBoundingClientRect().height;
  document.body.removeChild(measureNode);
  return Math.max(height, fontSize * lineHeight);
}

function textLineBleedPadding(fontSize: number, lineHeight: number): number {
  return Math.max(0, (fontSize - fontSize * lineHeight) / 2);
}

function textOverflowOffset(verticalAlign: TextVerticalAlign, containerHeight: number, textHeight: number): number {
  if (verticalAlign === 'bottom') return Math.min(0, containerHeight - textHeight);
  if (verticalAlign === 'middle') return Math.min(0, (containerHeight - textHeight) / 2);
  return 0;
}

interface InlineTextVerticalOffsetInput {
  verticalAlign: TextVerticalAlign;
  elementHeight: number;
  fontSize: number;
  lineHeight: number;
  autoFitEnabled: boolean;
  textContentHeight: number;
}

export function calculateInlineTextVerticalOffset({
  verticalAlign,
  elementHeight,
  fontSize,
  lineHeight,
  autoFitEnabled,
  textContentHeight,
}: InlineTextVerticalOffsetInput): number {
  const bleedPadding = textLineBleedPadding(fontSize, lineHeight);
  const frameContentHeight = autoFitEnabled
    ? elementHeight
    : Math.max(elementHeight, textContentHeight);
  const overflowOffset = textOverflowOffset(verticalAlign, elementHeight, frameContentHeight);
  const textFrameY = overflowOffset - bleedPadding;
  return -textFrameY;
}
