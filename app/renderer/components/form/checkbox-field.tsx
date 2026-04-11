import { Check } from 'lucide-react';
import { Checkbox } from './checkbox';

interface CheckboxFieldProps {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ checked, className, disabled = false, label, onChange }: CheckboxFieldProps) {
  return (
    <Checkbox.Root checked={checked} disabled={disabled} onCheckedChange={onChange} className={className}>
      <Checkbox.Indicator>{checked ? <Check size={11} strokeWidth={2.5} /> : null}</Checkbox.Indicator>
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  );
}
