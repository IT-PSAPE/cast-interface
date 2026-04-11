import type { CSSProperties, ReactNode } from 'react';
import { FieldLabel } from './field-label';
import { CustomSelect } from './custom-select';

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
  const select = (
    <div className="flex min-w-0 items-center">
      {icon ? (
        <span className="flex justify-center items-center shrink-0 size-6 ml-1 text-text-secondary">
          {icon}
        </span>
      ) : null}
      <CustomSelect value={value} onChange={onChange} onBlur={onBlur} options={options} />
    </div>
  );

  if (!label) return select;

  return <FieldLabel label={label} wide={wide}>{select}</FieldLabel>;
}
