import { Icon } from './icon';

interface CheckboxFieldProps {
  checked: boolean;
  className?: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ checked, className = '', label, onChange }: CheckboxFieldProps) {
  function handleCheckedChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.checked);
  }

  return (
    <label className={`flex items-center gap-2 text-sm text-text-secondary ${className}`}>
      <span className="relative grid h-4 w-4 shrink-0 place-items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleCheckedChange}
          className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
        />
        <span className="grid h-4 w-4 place-items-center rounded border border-border-primary bg-background-primary text-brand-700 transition-colors peer-checked:border-brand peer-checked:bg-background-brand_primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-border-brand">
          {checked ? <Icon.check size={11} strokeWidth={2.5} /> : null}
        </span>
      </span>
      <span>{label}</span>
    </label>
  );
}
