import { useLayoutEffect, useRef } from 'react';
import { Icon } from '../../../components/icon';
import { FieldTextarea } from '../../../components/labeled-field';
import type { DropPlacement, LyricEditorRowState } from '../hooks/use-lyric-editor-document';

interface LyricEditorModalRowProps {
  row: LyricEditorRowState;
  rowIndex: number;
  isSaving: boolean;
  isActive: boolean;
  onFocusRow: (rowKey: string | null) => void;
  onSetRowText: (rowKey: string, text: string) => void;
  onSplitRow: (rowKey: string, textarea: HTMLTextAreaElement) => void;
  onTextareaMount: (rowKey: string, node: HTMLTextAreaElement | null) => void;
  onOpenRowMenu: (rowKey: string, x: number, y: number) => void;
  onOpenRowMenuFromButton: (rowKey: string, button: HTMLButtonElement) => void;
  onHandleDragStart: (rowKey: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onHandleDragOver: (rowKey: string, placement: DropPlacement, event: React.DragEvent<HTMLElement>) => void;
  onHandleDrop: (rowKey: string, placement: DropPlacement, event: React.DragEvent<HTMLElement>) => void;
  onHandleDragEnd: () => void;
  dragging: boolean;
  dropPlacement: DropPlacement | null;
}

export function LyricEditorModalRow({ row, rowIndex, isSaving, isActive, onFocusRow, onSetRowText, onSplitRow, onTextareaMount, onOpenRowMenu, onOpenRowMenuFromButton, onHandleDragStart, onHandleDragOver, onHandleDrop, onHandleDragEnd, dragging, dropPlacement }: LyricEditorModalRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 44)}px`;
  }, [row.text]);

  function handleTextChange(text: string) {
    onSetRowText(row.key, text);
  }

  function handleTextareaMount(node: HTMLTextAreaElement | null) {
    textareaRef.current = node;
    onTextareaMount(row.key, node);
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') return;
    event.preventDefault();
    onSplitRow(row.key, event.currentTarget);
  }

  function handleTextareaFocus() {
    onFocusRow(row.key);
  }

  function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    onOpenRowMenuFromButton(row.key, event.currentTarget);
  }

  function handleMenuButtonContextMenu(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    onOpenRowMenu(row.key, event.clientX, event.clientY);
  }

  function handleDragStart(event: React.DragEvent<HTMLButtonElement>) {
    onHandleDragStart(row.key, event);
  }

  function handleDragEnd() {
    onHandleDragEnd();
  }

  function handleDropBefore(event: React.DragEvent<HTMLElement>) {
    onHandleDrop(row.key, 'before', event);
  }

  function handleDropAfter(event: React.DragEvent<HTMLElement>) {
    onHandleDrop(row.key, 'after', event);
  }

  function handleDragOverBefore(event: React.DragEvent<HTMLElement>) {
    onHandleDragOver(row.key, 'before', event);
  }

  function handleDragOverAfter(event: React.DragEvent<HTMLElement>) {
    onHandleDragOver(row.key, 'after', event);
  }

  const rowClassName = dragging ? 'opacity-60' : '';
  const beforeDropClassName = dropPlacement === 'before' ? 'opacity-100' : 'opacity-0';
  const afterDropClassName = dropPlacement === 'after' ? 'opacity-100' : 'opacity-0';
  const activeClassName = isActive ? 'bg-background-secondary/40' : 'bg-transparent';
  const handleClassName = isActive ? 'text-text-primary opacity-100' : 'text-text-tertiary opacity-65';

  return (
    <div data-testid={`lyric-editor-row-${row.key}`} className={`group relative grid grid-cols-[40px_minmax(0,1fr)] gap-4 rounded-2xl px-2 py-2.5 transition-colors hover:bg-background-secondary/30 ${activeClassName} ${rowClassName}`}>
      <div aria-hidden="true" className={`pointer-events-none absolute left-0 right-0 top-0 h-px bg-brand transition-opacity ${beforeDropClassName}`} />
      <div aria-hidden="true" className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-brand transition-opacity ${afterDropClassName}`} />

      <div className="grid content-start pt-1">
        <button
          type="button"
          aria-label={`Open actions for slide row ${rowIndex + 1}`}
          title="Row actions"
          disabled={isSaving}
          draggable={!isSaving}
          onClick={handleMenuButtonClick}
          onContextMenu={handleMenuButtonContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`grid h-8 w-8 cursor-grab place-items-center rounded-lg transition-colors hover:bg-background-tertiary hover:text-text-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 ${handleClassName}`}
        >
          <Icon.dots_grid size={16} strokeWidth={1.8} />
        </button>
      </div>

      <div className="grid gap-1">
        <div
          data-testid={`lyric-editor-drop-before-${row.key}`}
          className="h-2 rounded-lg"
          onDragOver={handleDragOverBefore}
          onDrop={handleDropBefore}
        />
        <div className="grid gap-1.5 rounded-xl px-2 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">Slide {rowIndex + 1}</span>
          </div>
          <FieldTextarea
            value={row.text}
            onChange={handleTextChange}
            onKeyDown={handleTextareaKeyDown}
            textareaRef={handleTextareaMount}
            placeholder="Write lyrics..."
            disabled={isSaving}
            rows={1}
            resize="none"
            onFocus={handleTextareaFocus}
            className="min-h-0 border-transparent bg-transparent px-0 py-0 text-[28px] font-medium leading-[1.35] text-text-primary placeholder:text-text-tertiary/55 focus:border-transparent focus:outline-none"
          />
        </div>
        <div
          data-testid={`lyric-editor-drop-after-${row.key}`}
          className="h-2 rounded-lg"
          onDragOver={handleDragOverAfter}
          onDrop={handleDropAfter}
        />
      </div>
    </div>
  );
}
