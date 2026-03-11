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
    textStrokeEnabled?: boolean;
    textStrokeColor?: string;
    textStrokeWidth?: number;
    textShadowEnabled?: boolean;
    textShadowColor?: string;
    textShadowBlur?: number;
    textShadowOffsetX?: number;
    textShadowOffsetY?: number;
  };

  const fontStyle = resolveKonvaTextStyle(payload.weight, payload.italic);
  const lineHeight = payload.lineHeight ?? 1.25;
  const verticalAlign = payload.verticalAlign ?? 'middle';
  const text = transformTextCase(payload.text ?? '', payload.caseTransform ?? 'none');

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        fill={node.visual.fillEnabled ? node.visual.fillColor : 'transparent'}
        stroke={node.visual.strokeEnabled ? node.visual.strokeColor : undefined}
        strokeWidth={node.visual.strokeEnabled ? node.visual.strokeWidth : 0}
        shadowEnabled={node.visual.shadowEnabled}
        shadowColor={node.visual.shadowColor}
        shadowBlur={node.visual.shadowBlur}
        shadowOffsetX={node.visual.shadowOffsetX}
        shadowOffsetY={node.visual.shadowOffsetY}
        listening={false}
      />
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
        fill={payload.color}
        textDecoration={`${payload.underline ? 'underline' : ''} ${payload.strikethrough ? 'line-through' : ''}`.trim()}
        stroke={payload.textStrokeEnabled ? payload.textStrokeColor : undefined}
        strokeWidth={payload.textStrokeEnabled ? payload.textStrokeWidth ?? 0 : 0}
        shadowEnabled={payload.textShadowEnabled}
        shadowColor={payload.textShadowColor}
        shadowBlur={payload.textShadowBlur}
        shadowOffsetX={payload.textShadowOffsetX}
        shadowOffsetY={payload.textShadowOffsetY}
      />
    </>
  );
}
