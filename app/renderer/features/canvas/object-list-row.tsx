import type { SlideElement, TextElementPayload } from '@core/types';
import { Box, Film, Image, Square, Type } from 'lucide-react';
import { SelectableRow } from '../../components/display/selectable-row';
import { useObjectList } from './object-list-context';
import { compactText } from '../../utils/slides';

interface ObjectListRowProps {
  element: SlideElement;
}

export function ObjectListRow({ element }: ObjectListRowProps) {
  const { selectedElementId, onSelect } = useObjectList();

  const selected = element.id === selectedElementId;
  const title = objectTitle(element);

  function handleSelect() {
    onSelect(element.id);
  }

  return (
    <SelectableRow.Root
      selected={selected}
      onClick={handleSelect}
    >
      <SelectableRow.Leading>
        <TypeIcon type={element.type} />
      </SelectableRow.Leading>
      <SelectableRow.Label>{title}</SelectableRow.Label>
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
