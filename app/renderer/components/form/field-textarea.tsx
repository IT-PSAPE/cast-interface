import type { KeyboardEventHandler, Ref } from 'react';
import { FieldLabel } from './field-label';

interface FieldTextareaProps {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  className?: string;
  label?: string;
  resize?: 'none' | 'vertical';
  rows?: number;
  textareaRef?: Ref<HTMLTextAreaElement>;
  wide?: boolean;
}

export function FieldTextarea({ disabled = false, value, onChange, onFocus, onKeyDown, placeholder, className = '', label, resize = 'vertical', rows, textareaRef, wide }: FieldTextareaProps) {
  function handleValueChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  const resizeClassName = resize === 'none' ? 'resize-none' : 'resize-y';
  const textarea = (
    <textarea
      ref={textareaRef}
      value={value}
      rows={rows}
      disabled={disabled}
      onChange={handleValueChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`min-w-0 w-full rounded border border-primary bg-primary px-1.5 py-1 text-sm text-primary min-h-[60px] ${resizeClassName} focus:border-brand focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );

  if (!label) return textarea;

  return <FieldLabel label={label} wide={wide}>{textarea}</FieldLabel>;
}
