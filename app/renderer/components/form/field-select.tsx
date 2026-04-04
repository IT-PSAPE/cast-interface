import type { CSSProperties, ReactNode } from 'react';
import { FieldLabel } from './field-label';

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

  return <FieldLabel label={label} wide={wide}>{select}</FieldLabel>;
}
