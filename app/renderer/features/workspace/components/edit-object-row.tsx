import type { MouseEvent, ReactNode } from 'react';
import type { Id, SlideElement, TextElementPayload } from '@core/types';
import { ActionButton } from '../../../components/action-button';
import { SelectableRow } from '../../../components/selectable-row';
import { compactText } from '../../../utils/slides';

interface EditObjectRowProps {
  element: SlideElement;
  selected: boolean;
  onSelect: (id: Id) => void;
  onToggleLock: (id: Id, locked: boolean) => void;
  onToggleVisibility: (id: Id, visible: boolean) => void;
}

export function EditObjectRow({ element, selected, onSelect, onToggleLock, onToggleVisibility }: EditObjectRowProps) {
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
  if (type === 'text') return <span className="grid h-4 w-4 place-items-center text-[10px] font-bold text-text-muted">T</span>;
  if (type === 'shape') return <span className="grid h-4 w-4 place-items-center text-[10px] font-bold text-text-muted">#</span>;
  if (type === 'image') return <span className="grid h-4 w-4 place-items-center text-[10px] font-bold text-text-muted">I</span>;
  if (type === 'video') return <span className="grid h-4 w-4 place-items-center text-[10px] font-bold text-text-muted">V</span>;
  return <span className="grid h-4 w-4 place-items-center text-[10px] font-bold text-text-muted">G</span>;
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
    : 'text-text-muted hover:text-text-secondary';
  return (
    <ActionButton
      variant="ghost"
      onClick={onClick}
      className={`grid h-5 w-5 place-items-center border-transparent bg-transparent p-0 ${classes}`}
    >
      <span className="sr-only">{label}</span>
      {children}
    </ActionButton>
  );
}

function LockIcon({ closed }: { closed: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="4" y="7" width="8" height="6" rx="1.2" strokeWidth="1.25" />
      {closed ? <path d="M5.5 7V5.4a2.5 2.5 0 0 1 5 0V7" strokeWidth="1.25" /> : <path d="M8 7V5.4a2.5 2.5 0 0 1 2.8-2.4" strokeWidth="1.25" />}
    </svg>
  );
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  if (!visible) {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
        <path d="M2 8c1.5-2.5 3.5-3.7 6-3.7S12.5 5.5 14 8c-1.5 2.5-3.5 3.7-6 3.7S3.5 10.5 2 8Z" strokeWidth="1.1" />
        <path d="m3 13 10-10" strokeWidth="1.25" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <path d="M2 8c1.5-2.5 3.5-3.7 6-3.7S12.5 5.5 14 8c-1.5 2.5-3.5 3.7-6 3.7S3.5 10.5 2 8Z" strokeWidth="1.1" />
      <circle cx="8" cy="8" r="1.8" strokeWidth="1.1" />
    </svg>
  );
}
