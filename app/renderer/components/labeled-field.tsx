import { useRef, type CSSProperties, type ReactNode } from 'react';

const LABEL_CLASS = 'grid min-w-0 gap-0.5 text-sm text-text-secondary';

interface FieldInputProps {
  disabled?: boolean;
  type?: 'number' | 'text';
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: ReactNode;
  label?: string;
  wide?: boolean;
}

export function FieldInput({ disabled = false, type = 'text', value, onChange, onBlur, min, max, step, icon, label, wide }: FieldInputProps) {
  function handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  const input = (
    <div className="flex min-w-0 w-full items-center min-h-8 rounded bg-tertiary text-sm text-text-primary transition-colors focus-within:border-brand">
      {icon ? (
        <span className="flex justify-center items-center shrink-0 size-6 ml-1 text-text-secondary">
          {icon}
        </span>
      ) : null}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={handleValueChange}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        className={`min-w-0 w-full bg-transparent py-1 pr-2 outline-none disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${icon ? 'pl-1' : 'pl-2'}`}
      />
    </div>
  );

  if (!label) return input;

  return (
    <label className={`${LABEL_CLASS} ${wide ? 'col-span-full' : ''}`}>
      <span className="truncate">{label}</span>
      {input}
    </label>
  );
}

interface FieldTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  wide?: boolean;
}

export function FieldTextarea({ value, onChange, placeholder, className = '', label, wide }: FieldTextareaProps) {
  function handleValueChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  const textarea = (
    <textarea
      value={value}
      onChange={handleValueChange}
      placeholder={placeholder}
      className={`min-w-0 w-full rounded border border-border-primary bg-primary px-1.5 py-1 text-sm text-text-primary min-h-[60px] resize-y focus:border-brand focus:outline-none transition-colors ${className}`}
    />
  );

  if (!label) return textarea;

  return (
    <label className={`${LABEL_CLASS} ${wide ? 'col-span-full' : ''}`}>
      <span className="truncate">{label}</span>
      {textarea}
    </label>
  );
}

interface FieldSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Array<{ value: string; label: string; style?: CSSProperties }>;
  icon?: ReactNode;
  label?: string;
  wide?: boolean;
}

export function FieldSelect({ value, onChange, onBlur, options, icon, label, wide }: FieldSelectProps) {
  function handleValueChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  const select = (
    <div className="flex min-w-0 items-center min-h-8 rounded-md bg-tertiary text-sm text-text-primary transition-colors focus-within:border-brand">
      {icon ? (
        <span className="flex justify-center items-center shrink-0 size-6 ml-1 text-text-secondary">
          {icon}
        </span>
      ) : null}
      <select
        value={value}
        onChange={handleValueChange}
        onBlur={onBlur}
        className={`min-w-0 w-full min-h-8 bg-transparent py-1 pr-2 outline-none ${icon ? 'pl-1' : 'pl-1.5'}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={opt.style}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (!label) return select;

  return (
    <label className={`${LABEL_CLASS} ${wide ? 'col-span-full' : ''}`}>
      <span className="truncate">{label}</span>
      {select}
    </label>
  );
}

type ColorMode = 'solid' | 'gradient' | 'image';

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

  function handleModeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onModeChange?.(event.target.value as ColorMode);
  }

  const colorField = (
    <div className="flex min-w-0 w-full items-center gap-1.5 min-h-8 rounded bg-tertiary text-sm text-text-primary transition-colors focus-within:border-brand">
      <button
        type="button"
        onClick={handleSwatchClick}
        className="ml-1.5 size-5 shrink-0 rounded border border-border-primary cursor-pointer"
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
      <span className="text-text-tertiary text-sm select-none">#</span>
      <input
        type="text"
        value={displayHex(safeValue)}
        onChange={handleHexInput}
        maxLength={8}
        className="min-w-0 w-full bg-transparent py-1 pr-2 outline-none font-mono text-sm"
      />
      {onModeChange ? (
        <select
          value={mode}
          onChange={handleModeChange}
          className="shrink-0 bg-transparent text-sm text-text-tertiary outline-none pr-1 cursor-pointer"
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
        </select>
      ) : null}
    </div>
  );

  if (!label) return colorField;

  return (
    <label className={`${LABEL_CLASS} ${wide ? 'col-span-full' : ''}`}>
      <span className="truncate">{label}</span>
      {colorField}
    </label>
  );
}
