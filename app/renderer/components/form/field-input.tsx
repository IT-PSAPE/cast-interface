import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { FieldLabel } from './field-label';

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
        className={cn('min-w-0 w-full bg-transparent py-1 pr-2 outline-none disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none', icon ? 'pl-1' : 'pl-2')}
      />
    </div>
  );

  if (!label) return input;

  return <FieldLabel label={label} wide={wide}>{input}</FieldLabel>;
}
