import { useRef } from 'react';
import { FieldLabel } from './field-label';
import { CustomSelect } from './custom-select';

type ColorMode = 'solid' | 'gradient' | 'image';

const FILL_MODE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
];

interface FieldColorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  label?: string;
  wide?: boolean;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
}

function toPickerHex(value: string): string {
  const hex = value.startsWith('#') ? value.slice(1) : value;
  return `#${hex.slice(0, 6).padEnd(6, '0')}`;
}

function displayHex(value: string): string {
  return value.startsWith('#') ? value.slice(1).toUpperCase() : value.toUpperCase();
}

export function FieldColor({ value, onChange, label, wide, mode = 'solid', onModeChange }: FieldColorProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const safeValue = typeof value === 'string' && value.length > 0 ? value : '#000000';

  function handlePickerChange(event: React.ChangeEvent<HTMLInputElement>) {
    const alpha = safeValue.length > 7 ? safeValue.slice(7) : '';
    onChange(event.target.value + alpha);
  }

  function handleHexInput(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/[^0-9a-fA-F]/g, '');
    onChange(`#${raw}`);
  }

  function handleSwatchClick() {
    pickerRef.current?.click();
  }

  function handleModeChange(value: string) {
    onModeChange?.(value as ColorMode);
  }

  const colorField = (
    <div className="flex min-w-0 w-full items-center gap-1.5 min-h-8 rounded bg-tertiary text-sm text-primary transition-colors focus-within:border-brand">
      <button
        type="button"
        onClick={handleSwatchClick}
        className="ml-1.5 size-5 shrink-0 rounded border border-primary cursor-pointer"
        style={{ backgroundColor: toPickerHex(safeValue) }}
      />
      <input
        ref={pickerRef}
        type="color"
        value={toPickerHex(safeValue)}
        onChange={handlePickerChange}
        className="sr-only"
        tabIndex={-1}
      />
      <span className="text-tertiary text-sm select-none">#</span>
      <input
        type="text"
        value={displayHex(safeValue)}
        onChange={handleHexInput}
        maxLength={8}
        className="min-w-0 w-full bg-transparent py-1 pr-2 outline-none font-mono text-sm"
      />
      {onModeChange ? (
        <CustomSelect
          value={mode}
          onChange={handleModeChange}
          options={FILL_MODE_OPTIONS}
          className="shrink-0"
        />
      ) : null}
    </div>
  );

  if (!label) return colorField;

  return <FieldLabel label={label} wide={wide}>{colorField}</FieldLabel>;
}
