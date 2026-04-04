import type { ThemeMode } from '../../../types/ui';
import { SegmentedControl } from '../../../components/controls/segmented-controls';
import { useTheme } from '../../../contexts/theme-context';
import { SettingsSection } from './settings-section';

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
    <div className="grid gap-6">
      <SettingsSection title="Theme">
        <div className="grid gap-2">
          <SegmentedControl.Root value={themeMode} onValueChange={handleThemeModeChange} aria-label="Theme mode">
            {themeOptions}
          </SegmentedControl.Root>
        </div>
      </SettingsSection>
    </div>
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
