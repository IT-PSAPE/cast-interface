import type {
  SlideElement,
  SlideElementPayload,
  ShapeElementPayload,
  TextElementPayload,
  TextCaseTransform,
  TextHorizontalAlign,
  TextVerticalAlign,
} from './types';

export interface VisualPayloadState {
  visible: boolean;
  locked: boolean;
  flipX: boolean;
  flipY: boolean;
  fillEnabled: boolean;
  fillColor: string;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface TextFormattingState {
  fontFamily: string;
  fontSize: number;
  weight: string;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  alignment: TextHorizontalAlign;
  verticalAlign: TextVerticalAlign;
  caseTransform: TextCaseTransform;
  lineHeight: number;
}

export function supportsVisualStyling(type: SlideElement['type']): boolean {
  return type === 'shape' || type === 'text';
}

export function readVisualPayload(type: SlideElement['type'], payload: SlideElementPayload): VisualPayloadState {
  const fillColor = type === 'shape' ? (payload as ShapeElementPayload).fillColor : type === 'text' ? (payload as TextElementPayload).color : '#FFFFFF';
  const strokeColor = type === 'shape' ? (payload as ShapeElementPayload).borderColor : payload.strokeColor ?? '#111111';
  const strokeWidth = type === 'shape' ? (payload as ShapeElementPayload).borderWidth : payload.strokeWidth ?? 1;
  return {
    visible: payload.visible ?? true,
    locked: payload.locked ?? false,
    flipX: payload.flipX ?? false,
    flipY: payload.flipY ?? false,
    fillEnabled: type === 'shape' || type === 'text' ? payload.fillEnabled ?? true : false,
    fillColor,
    strokeEnabled: type === 'shape' ? payload.strokeEnabled ?? strokeWidth > 0 : payload.strokeEnabled ?? false,
    strokeColor,
    strokeWidth,
    shadowEnabled: payload.shadowEnabled ?? false,
    shadowColor: payload.shadowColor ?? '#00000099',
    shadowBlur: payload.shadowBlur ?? 12,
    shadowOffsetX: payload.shadowOffsetX ?? 0,
    shadowOffsetY: payload.shadowOffsetY ?? 6,
  };
}

export function applyVisualPayload(type: SlideElement['type'], payload: SlideElementPayload, next: VisualPayloadState): SlideElementPayload {
  const basePatch = {
    visible: next.visible,
    locked: next.locked,
    flipX: next.flipX,
    flipY: next.flipY,
    shadowEnabled: next.shadowEnabled,
    shadowColor: next.shadowColor,
    shadowBlur: next.shadowBlur,
    shadowOffsetX: next.shadowOffsetX,
    shadowOffsetY: next.shadowOffsetY,
    strokeEnabled: next.strokeEnabled,
    strokeColor: next.strokeColor,
    strokeWidth: next.strokeWidth,
    fillEnabled: next.fillEnabled,
  };

  if (type === 'shape') {
    const shapePayload = payload as ShapeElementPayload;
    return {
      ...shapePayload,
      ...basePatch,
      fillColor: next.fillColor,
      borderColor: next.strokeColor,
      borderWidth: next.strokeEnabled ? next.strokeWidth : 0,
    };
  }
  if (type === 'text') {
    const textPayload = payload as TextElementPayload;
    return {
      ...textPayload,
      ...basePatch,
      color: next.fillColor,
    };
  }
  return { ...payload, ...basePatch };
}

export function readTextFormatting(payload: TextElementPayload): TextFormattingState {
  return {
    fontFamily: payload.fontFamily,
    fontSize: payload.fontSize,
    weight: payload.weight ?? '400',
    italic: payload.italic ?? false,
    underline: payload.underline ?? false,
    strikethrough: payload.strikethrough ?? false,
    alignment: payload.alignment ?? 'left',
    verticalAlign: payload.verticalAlign ?? 'middle',
    caseTransform: payload.caseTransform ?? 'none',
    lineHeight: payload.lineHeight ?? 1.25,
  };
}
