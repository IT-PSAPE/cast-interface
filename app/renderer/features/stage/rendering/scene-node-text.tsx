import { Rect, Text } from 'react-konva';
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
  const text = transformTextCase(payload.text ?? '', payload.caseTransform ?? 'none');

  return (
    <>
      <Rect x={0} y={0} width={element.width} height={element.height} fill="#000000" opacity={0} listening={false} />
      <Text
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        verticalAlign={verticalAlign}
        text={text}
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
    </>
  );
}
