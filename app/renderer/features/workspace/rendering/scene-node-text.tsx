import { Text } from 'react-konva';
import type { TextCaseTransform, TextHorizontalAlign } from '@core/types';
import type { RenderNode } from './scene-types';
import { resolveKonvaTextStyle } from './resolve-konva-text-style';

function transformTextCase(text: string, mode: TextCaseTransform): string {
  if (mode === 'uppercase') return text.toUpperCase();
  if (mode === 'sentence') return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
  return text;
}

function textAlign(alignment: TextHorizontalAlign): 'left' | 'center' | 'right' | 'justify' {
  if (alignment === 'center') return 'center';
  if (alignment === 'right' || alignment === 'end') return 'right';
  if (alignment === 'justify') return 'justify';
  return 'left';
}

function verticalOffset(verticalAlign: 'top' | 'middle' | 'bottom', lineHeight: number, fontSize: number, containerHeight: number): number {
  const textHeight = Math.max(fontSize * lineHeight, fontSize);
  if (verticalAlign === 'bottom') return Math.max(0, containerHeight - textHeight);
  if (verticalAlign === 'middle') return Math.max(0, (containerHeight - textHeight) / 2);
  return 0;
}

interface SceneNodeTextProps {
  node: RenderNode;
}

export function SceneNodeText({ node }: SceneNodeTextProps) {
  const element = node.element;
  const payload = element.payload as {
    text: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    alignment: TextHorizontalAlign;
    verticalAlign?: 'top' | 'middle' | 'bottom';
    caseTransform?: TextCaseTransform;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    lineHeight?: number;
    weight?: string;
  };

  const fontStyle = resolveKonvaTextStyle(payload.weight, payload.italic);
  const lineHeight = payload.lineHeight ?? 1.25;
  const verticalAlign = payload.verticalAlign ?? 'middle';

  return (
    <Text
      x={0}
      y={verticalOffset(verticalAlign, lineHeight, payload.fontSize, element.height)}
      width={element.width}
      height={element.height}
      text={transformTextCase(payload.text ?? '', payload.caseTransform ?? 'none')}
      fontFamily={payload.fontFamily || 'sans-serif'}
      fontSize={payload.fontSize}
      fontStyle={fontStyle}
      align={textAlign(payload.alignment ?? 'left')}
      lineHeight={lineHeight}
      fill={node.visual.fillEnabled ? payload.color : 'transparent'}
      textDecoration={`${payload.underline ? 'underline' : ''} ${payload.strikethrough ? 'line-through' : ''}`.trim()}
      stroke={node.visual.strokeEnabled ? node.visual.strokeColor : undefined}
      strokeWidth={node.visual.strokeEnabled ? node.visual.strokeWidth : 0}
      shadowEnabled={node.visual.shadowEnabled}
      shadowColor={node.visual.shadowColor}
      shadowBlur={node.visual.shadowBlur}
      shadowOffsetX={node.visual.shadowOffsetX}
      shadowOffsetY={node.visual.shadowOffsetY}
    />
  );
}
