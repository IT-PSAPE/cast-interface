import type { DeckItem, Id } from '@core/types';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { SelectableRow } from '../../components/display/selectable-row';

interface DeckBundleSelectionListProps {
  items: DeckItem[];
  selectedIds: Set<Id>;
  onToggle: (id: Id) => void;
}

interface DeckBundleSelectionRowProps {
  item: DeckItem;
  selected: boolean;
  onToggle: (id: Id) => void;
}

function DeckBundleSelectionRow({ item, selected, onToggle }: DeckBundleSelectionRowProps) {
  function handleClick() {
    onToggle(item.id);
  }

  return (
    <SelectableRow.Root
      selected={selected}
      onClick={handleClick}
      className="h-9"
    >
      <SelectableRow.Leading>
        <DeckItemIcon entity={item} size={14} strokeWidth={1.75} className="text-tertiary" />
      </SelectableRow.Leading>
      <SelectableRow.Label>{item.title}</SelectableRow.Label>
      <SelectableRow.Trailing>
        <span className="text-xs uppercase tracking-wide text-tertiary">{item.type}</span>
      </SelectableRow.Trailing>
    </SelectableRow.Root>
  );
}

export function DeckBundleSelectionList({ items, selectedIds, onToggle }: DeckBundleSelectionListProps) {
  const rows = items.map((item) => (
    <DeckBundleSelectionRow
      key={item.id}
      item={item}
      selected={selectedIds.has(item.id)}
      onToggle={onToggle}
    />
  ));

  if (rows.length === 0) {
    return <div className="rounded border border-primary bg-tertiary/30 px-3 py-4 text-sm text-tertiary">No matching items.</div>;
  }

  return <div className="flex flex-col gap-1">{rows}</div>;
}
