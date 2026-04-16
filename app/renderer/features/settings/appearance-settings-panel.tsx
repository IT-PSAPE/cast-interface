import type { ThemeMode } from '../../types/ui';
import { useTheme } from '../../contexts/theme-context';
import { SettingsSection } from './settings-section';
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
    <div className="flex flex-col gap-6">
      <SettingsSection.Root>
        <SettingsSection.Header>
          <SettingsSection.Title>Theme</SettingsSection.Title>
        </SettingsSection.Header>
        <SettingsSection.Body>
          <div className="flex flex-col gap-2">
            <SegmentedControl value={themeMode} onValueChange={handleThemeModeChange} aria-label="Theme mode">
              {themeOptions}
            </SegmentedControl>
          </div>
        </SettingsSection.Body>
      </SettingsSection.Root>
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
