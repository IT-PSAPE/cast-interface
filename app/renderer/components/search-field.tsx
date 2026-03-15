interface SearchFieldProps {
  className?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function SearchField({ className = '', onChange, placeholder = 'Search', value }: SearchFieldProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`rounded border border-border-primary bg-background-tertiary px-2 py-0.5 text-sm text-text-secondary placeholder:text-text-tertiary outline-none transition-colors focus:border-brand ${className}`}
    />
  );
}
