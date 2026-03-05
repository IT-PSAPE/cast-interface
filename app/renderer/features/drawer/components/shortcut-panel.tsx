import { SHORTCUTS } from '../../../utils/slides';

export function ShortcutPanel() {
  return (
    <div className="grid gap-0.5">
      {SHORTCUTS.map((item) => (
        <div key={item.keys} className="flex items-center justify-between py-1 px-1 rounded hover:bg-surface-2/50 transition-colors">
          <kbd className="rounded border border-kbd-border bg-kbd-bg text-kbd-text px-1.5 py-0.5 text-xs">
            {item.keys}
          </kbd>
          <span className="text-[12px] text-text-secondary">{item.action}</span>
        </div>
      ))}
    </div>
  );
}
