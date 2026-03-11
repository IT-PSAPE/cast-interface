import type { MouseEvent, ReactNode } from 'react';
import type { Id, SlideElement, TextElementPayload } from '@core/types';
import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
import { SelectableRow } from '../../../components/selectable-row';
import { compactText } from '../../../utils/slides';

interface ObjectListRowProps {
  element: SlideElement;
  selected: boolean;
  onSelect: (id: Id) => void;
  onToggleLock: (id: Id, locked: boolean) => void;
  onToggleVisibility: (id: Id, visible: boolean) => void;
}

export function ObjectListRow({ element, selected, onSelect, onToggleLock, onToggleVisibility }: ObjectListRowProps) {
  const visible = element.payload.visible ?? true;
  const locked = element.payload.locked ?? false;
  const title = objectTitle(element);

  function handleSelect() {
    onSelect(element.id);
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
      leading={<TypeIcon type={element.type} />}
      title={title}
      trailing={
        <span className="ml-auto flex items-center gap-1">
          <IconControlButton onClick={handleToggleLock} active={locked} label={locked ? 'Unlock object' : 'Lock object'}>
            <LockIcon closed={locked} />
          </IconControlButton>
          <IconControlButton onClick={handleToggleVisibility} active={visible} label={visible ? 'Hide object' : 'Show object'}>
            <VisibilityIcon visible={visible} />
          </IconControlButton>
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

interface IconControlButtonProps {
  active: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

function IconControlButton({ active, label, onClick, children }: IconControlButtonProps) {
  const classes = active
    ? 'text-text-primary hover:text-text-primary'
    : 'text-text-tertiary hover:text-text-secondary';
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`grid h-5 w-5 place-items-center border-transparent bg-transparent p-0 ${classes}`}
    >
      <span className="sr-only">{label}</span>
      {children}
    </Button>
  );
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
