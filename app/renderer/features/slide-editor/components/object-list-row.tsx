import type { Id, SlideElement, TextElementPayload } from '@core/types';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { SelectableRow } from '../../../components/selectable-row';
import type { StackDropPlacement } from '../utils/reorder-element-stack';
import { compactText } from '../../../utils/slides';

interface ObjectListRowProps {
  element: SlideElement;
  selected: boolean;
  dragging: boolean;
  dropPlacement: StackDropPlacement | null;
  onSelect: (id: Id) => void;
  onDragEnd: () => void;
  onDragOver: (id: Id, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragStart: (id: Id, event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (id: Id, event: React.DragEvent<HTMLButtonElement>) => void;
  onToggleLock: (id: Id, locked: boolean) => void;
  onToggleVisibility: (id: Id, visible: boolean) => void;
}

export function ObjectListRow({
  element,
  selected,
  dragging,
  dropPlacement,
  onSelect,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onToggleLock,
  onToggleVisibility,
}: ObjectListRowProps) {
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
    <SelectableRow
      selected={selected}
      onClick={handleSelect}
      className={`${dropClassName} ${dragClassName}`}
      draggable={!locked}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      leading={<TypeIcon type={element.type} />}
      title={title}
      trailing={
        <span className="ml-auto flex items-center gap-1">
          <IconButton size="sm" variant="ghost" label={locked ? 'Unlock object' : 'Lock object'} onClick={handleToggleLock} className={locked ? 'text-text-primary' : 'text-text-tertiary'}>
            <LockIcon closed={locked} />
          </IconButton>
          <IconButton size="sm" variant="ghost" label={visible ? 'Hide object' : 'Show object'} onClick={handleToggleVisibility} className={visible ? 'text-text-primary' : 'text-text-tertiary'}>
            <VisibilityIcon visible={visible} />
          </IconButton>
        </span>
      }
    />
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
  const className = "text-text-tertiary";
  if (type === 'text') return <Icon.type_01 size={12} strokeWidth={2} className={className} />;
  if (type === 'shape') return <Icon.square size={12} strokeWidth={2} className={className} />;
  if (type === 'image') return <Icon.image_03 size={12} strokeWidth={2} className={className} />;
  if (type === 'video') return <Icon.film_01 size={12} strokeWidth={2} className={className} />;
  return <Icon.box size={12} strokeWidth={2} className={className} />;
}


function LockIcon({ closed }: { closed: boolean }) {
  return closed
    ? <Icon.lock_01 size={14} strokeWidth={1.5} />
    : <Icon.lock_unlocked_01 size={14} strokeWidth={1.5} />;
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  return visible
    ? <Icon.eye size={14} strokeWidth={1.5} />
    : <Icon.eye_off size={14} strokeWidth={1.5} />;
}
