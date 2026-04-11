import type { ContentItem, Id } from '@core/types';
import { ContentItemIcon } from '../../components/display/presentation-entity-icon';
import { SelectableRow } from '../../components/display/selectable-row';

interface ContentBundleSelectionListProps {
  items: ContentItem[];
  selectedIds: Set<Id>;
  onToggle: (id: Id) => void;
}

interface ContentBundleSelectionRowProps {
  item: ContentItem;
  selected: boolean;
  onToggle: (id: Id) => void;
}

function ContentBundleSelectionRow({ item, selected, onToggle }: ContentBundleSelectionRowProps) {
  function handleClick() {
    onToggle(item.id);
  }

  return (
    <SelectableRow
      selected={selected}
      onClick={handleClick}
      leading={<ContentItemIcon entity={item} size={14} strokeWidth={1.75} className="text-tertiary" />}
      title={item.title}
      trailing={<span className="shrink-0 text-xs uppercase tracking-wide text-tertiary">{item.type}</span>}
      className="h-9"
    />
  );
}

export function ContentBundleSelectionList({ items, selectedIds, onToggle }: ContentBundleSelectionListProps) {
  const rows = items.map((item) => (
    <ContentBundleSelectionRow
      key={item.id}
      item={item}
      selected={selectedIds.has(item.id)}
      onToggle={onToggle}
    />
  ));

  if (rows.length === 0) {
    return <div className="rounded border border-primary bg-tertiary/30 px-3 py-4 text-sm text-tertiary">No matching items.</div>;
  }

  return <div className="grid gap-1">{rows}</div>;
}
