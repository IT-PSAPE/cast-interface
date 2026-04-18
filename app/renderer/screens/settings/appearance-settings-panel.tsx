import type { ThemeMode } from '../../types/ui';
import { useTheme } from '../../contexts/app-context';
import { SegmentedControl } from '@renderer/components/controls/segmented-control';

const THEME_OPTIONS: ThemeMode[] = ['light', 'dark', 'system'];

export function AppearanceSettingsPanel() {
  const { state: { themeMode }, actions: { setThemeMode } } = useTheme();
  const themeOptions = THEME_OPTIONS.map(renderThemeOption);

  function handleThemeModeChange(value: string | string[]) {
    if (Array.isArray(value)) return;
    if (value === 'light' || value === 'dark' || value === 'system') {
      setThemeMode(value);
    }
  }

  return (
    <section className="flex flex-col gap-3 border-b border-primary pb-5 last:border-b-0 last:pb-0">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">Theme</h2>
      </header>
      <div className="flex flex-col gap-2">
        <SegmentedControl value={themeMode} onValueChange={handleThemeModeChange} aria-label="Theme mode">
          {themeOptions}
        </SegmentedControl>
      </div>
    </section>
  );
}

function labelForTheme(mode: ThemeMode | 'light' | 'dark'): string {
  if (mode === 'light') return 'Light';
  if (mode === 'dark') return 'Dark';
  return 'System';
}

function renderThemeOption(option: ThemeMode) {
  return (
    <SegmentedControl.Label key={option} value={option}>
      {labelForTheme(option)}
    </SegmentedControl.Label>
  );
}
