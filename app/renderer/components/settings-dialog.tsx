import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/theme-context';
import type { ThemeMode } from '../types/ui';

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
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
  }

  return (
    <div
      ref={backdropRef}
      className="pointer-events-auto absolute inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-[360px] rounded-lg border border-border-primary bg-background-primary_alt shadow-2xl">
        <header className="flex items-center justify-between border-b border-border-primary px-4 py-3">
          <h2 className="m-0 text-[14px] font-semibold text-text-primary">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded bg-transparent text-[16px] text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <div className="p-4">
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
              Appearance
            </legend>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((option) => renderThemeOption(option, themeMode, handleThemeChange))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

function renderThemeOption(
  option: { value: ThemeMode; label: string; description: string },
  currentMode: ThemeMode,
  onChange: (mode: ThemeMode) => void,
) {
  const isActive = currentMode === option.value;
  const borderClass = isActive
    ? 'border-brand ring-1 ring-brand-400'
    : 'border-border-primary hover:border-text-tertiary';

  function handleClick() {
    onChange(option.value);
  }

  return (
    <button
      key={option.value}
      type="button"
      onClick={handleClick}
      className={`flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${borderClass} bg-background-tertiary`}
    >
      <ThemePreviewIcon mode={option.value} active={isActive} />
      <span className="text-[12px] font-medium text-text-primary">{option.label}</span>
    </button>
  );
}

function ThemePreviewIcon({ mode, active }: { mode: ThemeMode; active: boolean }) {
  const strokeColor = active ? 'var(--color-border-brand)' : 'var(--color-border-primary)';

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
