interface GridSizeSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function GridSizeSlider({ value, min, max, onChange }: GridSizeSliderProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value));
  }

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={10}
      value={value}
      onChange={handleChange}
      aria-label="Grid item size"
      className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-transparent [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-text-secondary [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-3px] [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-text-secondary"
      style={{
        background: `linear-gradient(to right, var(--color-text-tertiary) 0%, var(--color-text-tertiary) ${percent}%, var(--color-background-tertiary) ${percent}%, var(--color-background-tertiary) 100%)`,
      }}
    />
  );
}
