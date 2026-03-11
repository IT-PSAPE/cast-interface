interface MeasureTextBlockInput {
  text: string;
  width: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  lineHeight: number;
}

type TextVerticalAlign = 'top' | 'middle' | 'bottom';

let measurementContext: CanvasRenderingContext2D | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (measurementContext) return measurementContext;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  measurementContext = canvas.getContext('2d');
  return measurementContext;
}

function buildFontDeclaration(fontStyle: string, fontSize: number, fontFamily: string): string {
  return `${fontStyle} ${fontSize}px ${fontFamily}`;
}

function countWrappedLines(text: string, width: number, context: CanvasRenderingContext2D): number {
  const paragraphs = text.split('\n');
  let lineCount = 0;

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lineCount += 1;
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (!currentLine || context.measureText(candidate).width <= width) {
        currentLine = candidate;
        continue;
      }

      lineCount += 1;
      currentLine = word;
    }

    if (currentLine) {
      lineCount += 1;
    }
  }

  return Math.max(1, lineCount);
}

export function measureTextBlockHeight({ text, width, fontFamily, fontSize, fontStyle, lineHeight }: MeasureTextBlockInput): number {
  const context = getMeasurementContext();
  if (!context) return fontSize;

  context.font = buildFontDeclaration(fontStyle, fontSize, fontFamily);
  const lineCount = countWrappedLines(text, Math.max(1, width), context);
  return fontSize + Math.max(0, lineCount - 1) * fontSize * lineHeight;
}

export function verticalTextOffset(verticalAlign: TextVerticalAlign, containerHeight: number, textHeight: number): number {
  if (verticalAlign === 'bottom') return Math.max(0, containerHeight - textHeight);
  if (verticalAlign === 'middle') return Math.max(0, (containerHeight - textHeight) / 2);
  return 0;
}
