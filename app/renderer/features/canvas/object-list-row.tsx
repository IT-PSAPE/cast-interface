import type { Id, SlideElement, TextElementPayload } from '@core/types';
import { Box, Eye, EyeOff, Film, Image, Lock, LockOpen, Square, Type } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SelectableRow } from '../../components/display/selectable-row';
import { useObjectList } from './object-list-context';
import { compactText } from '../../utils/slides';

interface ObjectListRowProps {
  element: SlideElement;
}

export function ObjectListRow({ element }: ObjectListRowProps) {
  const {
    selectedElementId,
    draggingId,
    dropTarget,
    onSelect,
    onDragEnd,
    onDragOver,
    onDragStart,
    onDrop,
    onToggleLock,
    onToggleVisibility,
  } = useObjectList();

  const selected = element.id === selectedElementId;
  const dragging = element.id === draggingId;
  const dropPlacement = dropTarget?.elementId === element.id ? dropTarget.placement : null;
  const visible = element.payload.visible ?? true;
  const locked = element.payload.locked ?? false;
  const title = objectTitle(element);
  const dropClassName = dropPlacement === 'before'
    ? 'shadow-[inset_0_2px_0_0_var(--color-border-brand)]'
    : dropPlacement === 'after'
      ? 'shadow-[inset_0_-2px_0_0_var(--color-border-brand)]'
      : '';
  const dragClassName = dragging ? 'cursor-grabbing opacity-60' : locked ? '' : 'cursor-grab';

  function handleSelect() {
    onSelect(element.id);
  }

  function handleDragStart(event: React.DragEvent<HTMLButtonElement>) {
    if (locked) {
      event.preventDefault();
      return;
    }
    onDragStart(element.id, event);
  }

  function handleDragOver(event: React.DragEvent<HTMLButtonElement>) {
    onDragOver(element.id, event);
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    onDrop(element.id, event);
  }

  function handleToggleLock(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleLock(element.id, !locked);
  }

  function handleToggleVisibility(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleVisibility(element.id, !visible);
  }

  return (
    <SelectableRow.Root
      selected={selected}
      onClick={handleSelect}
      className={`${dropClassName} ${dragClassName}`}
      draggable={!locked}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
    >
      <SelectableRow.Leading>
        <TypeIcon type={element.type} />
      </SelectableRow.Leading>
      <SelectableRow.Label>{title}</SelectableRow.Label>
      <SelectableRow.Trailing>
        <span className="flex items-center gap-1">
          <Button.Icon variant="ghost" label={locked ? 'Unlock object' : 'Lock object'} onClick={handleToggleLock} className={locked ? 'text-primary' : 'text-tertiary'}>
            <LockIcon closed={locked} />
          </Button.Icon>
          <Button.Icon variant="ghost" label={visible ? 'Hide object' : 'Show object'} onClick={handleToggleVisibility} className={visible ? 'text-primary' : 'text-tertiary'}>
            <VisibilityIcon visible={visible} />
          </Button.Icon>
        </span>
      </SelectableRow.Trailing>
    </SelectableRow.Root>
  );
}

function objectTitle(element: SlideElement): string {
  if (element.type !== 'text') return capitalize(element.type);
  const payload = element.payload as TextElementPayload;
  const rawText = String(payload.text ?? '').trim();
  if (!rawText) return 'Text';
  return compactText(rawText, 32);
}

function capitalize(value: string): string {
  if (!value) return value;
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function TypeIcon({ type }: { type: SlideElement['type'] }) {
  const className = "text-tertiary";
  if (type === 'text') return <Type size={12} strokeWidth={2} className={className} />;
  if (type === 'shape') return <Square size={12} strokeWidth={2} className={className} />;
  if (type === 'image') return <Image size={12} strokeWidth={2} className={className} />;
  if (type === 'video') return <Film size={12} strokeWidth={2} className={className} />;
  return <Box size={12} strokeWidth={2} className={className} />;
}

function LockIcon({ closed }: { closed: boolean }) {
  return closed
    ? <Lock size={14} strokeWidth={1.5} />
    : <LockOpen size={14} strokeWidth={1.5} />;
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  return visible
    ? <Eye size={14} strokeWidth={1.5} />
    : <EyeOff size={14} strokeWidth={1.5} />;
}
