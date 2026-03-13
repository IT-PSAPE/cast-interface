import { useTheme } from '../contexts/theme-context';
import type { ThemeMode } from '../types/ui';
import { DialogFrame } from './dialog-frame';
import { SegmentedControl as Control } from './segmented-controls';

interface SettingsDialogProps {
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Always use light appearance' },
  { value: 'dark', label: 'Dark', description: 'Always use dark appearance' },
  { value: 'system', label: 'System', description: 'Match your operating system' },
];

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { themeMode, setThemeMode } = useTheme();

  function handleThemeChange(mode: string) {
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      setThemeMode(mode);
    }
  }

  return (
    <DialogFrame
      title="Settings"
      onClose={onClose}
      data-ui-region="settings-dialog"
      popupClassName="max-w-[360px]"
    >
      <div className="p-4">
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Appearance
          </legend>
          <Control.Root value={themeMode} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-2 bg-transparent p-0" fill aria-label="Appearance">
            {THEME_OPTIONS.map(renderThemeOption)}
          </Control.Root>
        </fieldset>
      </div>
    </DialogFrame>
  );
}

function renderThemeOption(option: { value: ThemeMode; label: string; description: string }) {
  return (
    <Control.Label
      key={option.value}
      value={option.value}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-border-primary bg-background-tertiary p-3 text-center transition-colors hover:border-text-tertiary"
    >
      <ThemePreviewIcon mode={option.value} />
      <span className="text-sm font-medium text-text-primary">{option.label}</span>
    </Control.Label>
  );
}

function ThemePreviewIcon({ mode }: { mode: ThemeMode }) {
  const strokeColor = 'var(--color-border-primary)';

  if (mode === 'light') {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <circle cx="16" cy="16" r="6" fill="currentColor" stroke={strokeColor} strokeWidth="1.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 16 + Math.cos(rad) * 9;
          const y1 = 16 + Math.sin(rad) * 9;
          const x2 = 16 + Math.cos(rad) * 12;
          const y2 = 16 + Math.sin(rad) * 12;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />;
        })}
      </svg>
    );
  }

  if (mode === 'dark') {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path
          d="M22 16a8 8 0 0 1-12.5 6.6A8 8 0 0 0 19.4 9.5 8 8 0 0 1 22 16z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect x="6" y="8" width="20" height="16" rx="2" fill="none" stroke={strokeColor} strokeWidth="1.5" />
      <line x1="16" y1="8" x2="16" y2="24" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
      <rect x="7" y="9" width="9" height="14" rx="1" fill="#f5f6f7" opacity="0.3" />
      <rect x="16" y="9" width="9" height="14" rx="1" fill="#1a1a1a" opacity="0.3" />
    </svg>
  );
}
