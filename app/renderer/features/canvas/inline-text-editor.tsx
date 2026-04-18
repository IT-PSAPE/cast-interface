import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlideElement, TextElementPayload } from '@core/types';
import { measureInlineTextHeight, resolveInlineTextAlign } from './inline-text-editor-utils';

interface InlineTextEditorProps {
  editingTextId: string;
  effectiveElements: SlideElement[];
  sceneOffsetX: number;
  sceneOffsetY: number;
  sceneScale: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export function InlineTextEditor({ editingTextId, effectiveElements, sceneOffsetX, sceneOffsetY, sceneScale, onCommit, onCancel }: InlineTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const initialTextRef = useRef('');

  const element = effectiveElements.find((el) => el.id === editingTextId);
  const payload = element?.type === 'text' ? (element.payload as unknown as TextElementPayload) : null;

  useEffect(() => {
    if (!payload) return;
    const text = payload.text ?? '';
    setDraft(text);
    initialTextRef.current = text;
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.select();
    });
  }, [editingTextId]);

  const handleBlur = useCallback(() => {
    onCommit(draft);
  }, [draft, onCommit]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onCommit(draft);
    }
  }, [draft, onCommit, onCancel]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  if (!element || !payload) return null;

  const left = sceneOffsetX + element.x * sceneScale;
  const top = sceneOffsetY + element.y * sceneScale;
  const width = element.width * sceneScale;
  const height = element.height * sceneScale;
  const fontSize = payload.fontSize * sceneScale;
  const lineHeight = payload.lineHeight ?? 1.25;
  const fontWeight = payload.weight ?? '400';
  const fontStyle = payload.italic ? 'italic' : 'normal';
  const textAlign = resolveInlineTextAlign(payload.alignment);
  const verticalAlign = payload.verticalAlign ?? 'middle';
  const contentHeight = measureInlineTextHeight({
    text: draft,
    width: Math.max(width - 4, 1),
    fontSize,
    lineHeight,
    fontWeight,
    fontStyle,
    fontFamily: payload.fontFamily || 'sans-serif',
  });
  const innerHeight = Math.max(height - 4, 0);
  const remainingVerticalSpace = Math.max(0, innerHeight - contentHeight);
  const paddingTop = verticalAlign === 'top'
    ? 0
    : verticalAlign === 'bottom'
      ? remainingVerticalSpace
      : remainingVerticalSpace / 2;

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="absolute z-10 resize-none overflow-hidden border-2 border-[#4DA3FF] bg-transparent outline-none"
      style={{
        left,
        top,
        width,
        height,
        boxSizing: 'border-box',
        fontSize,
        lineHeight,
        fontWeight,
        fontStyle,
        fontFamily: payload.fontFamily || 'sans-serif',
        color: payload.color,
        textAlign,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        transformOrigin: 'top left',
        paddingTop,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        margin: 0,
      }}
    />
  );
}
