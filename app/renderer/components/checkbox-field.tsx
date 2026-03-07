interface CheckboxFieldProps {
  checked: boolean;
  className?: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ checked, className = '', label, onChange }: CheckboxFieldProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.checked);
  }

  return (
    <label className={`flex items-center gap-2 text-[12px] text-text-secondary ${className}`}>
      <input type="checkbox" checked={checked} onChange={handleChange} />
      <span>{label}</span>
    </label>
  );
}
