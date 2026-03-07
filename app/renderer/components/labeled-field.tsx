import type { CSSProperties, ReactNode } from 'react';

interface LabeledFieldProps {
  label: string;
  wide?: boolean;
  children: ReactNode;
}

export function LabeledField({ label, wide, children }: LabeledFieldProps) {
  return (
    <label className={`grid gap-0.5 text-[11px] text-text-secondary ${wide ? 'col-span-full' : ''}`}>
      {label}
      {children}
    </label>
  );
}

interface FieldInputProps {
  type?: 'number' | 'text';
  value: string | number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function FieldInput({ type = 'text', value, onChange, min, max, step }: FieldInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      className="rounded border border-stroke bg-surface-1 px-1.5 py-1 text-[12px] text-text-primary focus:border-focus focus:outline-none transition-colors"
    />
  );
}

interface FieldTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FieldTextarea({ value, onChange, placeholder, className = '' }: FieldTextareaProps) {
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`rounded border border-stroke bg-surface-1 px-1.5 py-1 text-[12px] text-text-primary min-h-[60px] resize-y focus:border-focus focus:outline-none transition-colors ${className}`}
    />
  );
}

interface FieldSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; style?: CSSProperties }>;
}

export function FieldSelect({ value, onChange, options }: FieldSelectProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded border border-stroke bg-surface-1 px-1.5 py-1 text-[12px] text-text-primary focus:border-focus focus:outline-none transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={opt.style}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
