import { useEffect, useState } from 'react';
import type { Hsb, Rgb, Hsl } from '../../../utils/color';
import {
  hexToHsb, hsbToRgb, rgbToHex, rgbToHsb, rgbToHsl, hslToRgb,
} from '../../../utils/color';
import { CustomSelect } from '../custom-select';

type ColorMode = 'hex' | 'rgb' | 'hsb' | 'hsl';

const COLOR_MODE_OPTIONS = [
  { value: 'hex', label: 'Hex' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsb', label: 'HSB' },
  { value: 'hsl', label: 'HSL' },
];

function clampInt(value: string, min: number, max: number): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

interface ColorModeInputsProps {
  hsb: Hsb;
  alpha: number;
  mode: ColorMode;
  showAlpha: boolean;
  onHsbChange: (hsb: Hsb) => void;
  onAlphaChange: (a: number) => void;
  onModeChange: (mode: ColorMode) => void;
}

export function ColorModeInputs({ hsb, alpha, mode, showAlpha, onHsbChange, onAlphaChange, onModeChange }: ColorModeInputsProps) {
  const rgb = hsbToRgb(hsb);
  const hsl = rgbToHsl(rgb);

  function handleModeSelect(value: string) {
    onModeChange(value as ColorMode);
  }

  function handleRgbChange(channel: keyof Rgb, value: string) {
    const n = clampInt(value, 0, 255);
    onHsbChange(rgbToHsb({ ...rgb, [channel]: n }));
  }

  function handleHsbChange(channel: keyof Hsb, value: string) {
    const max = channel === 'h' ? 360 : 100;
    onHsbChange({ ...hsb, [channel]: clampInt(value, 0, max) });
  }

  function handleHslChange(channel: keyof Hsl, value: string) {
    const max = channel === 'h' ? 360 : 100;
    onHsbChange(rgbToHsb(hslToRgb({ ...hsl, [channel]: clampInt(value, 0, max) })));
  }

  function handleHexCommit(value: string) {
    const raw = value.replace(/[^0-9a-fA-F]/g, '');
    if (raw.length >= 6) {
      onHsbChange(hexToHsb(`#${raw.slice(0, 6)}`));
      if (raw.length >= 8) {
        onAlphaChange(Math.round((parseInt(raw.slice(6, 8), 16) / 255) * 100));
      }
    }
  }

  function handleAlphaInput(value: string) {
    onAlphaChange(clampInt(value, 0, 100));
  }

  return (
    <div className="flex items-stretch gap-px">
      <CustomSelect value={mode} onChange={handleModeSelect} options={COLOR_MODE_OPTIONS} className="shrink-0" />

      {mode === 'hex' ? <MiniHexInput value={rgbToHex(rgb)} onCommit={handleHexCommit} /> : null}
      {mode === 'rgb' ? (
        <SplitInputGroup>
          <SplitInput value={rgb.r} onChange={(v) => handleRgbChange('r', v)} />
          <SplitInput value={rgb.g} onChange={(v) => handleRgbChange('g', v)} />
          <SplitInput value={rgb.b} onChange={(v) => handleRgbChange('b', v)} />
        </SplitInputGroup>
      ) : null}
      {mode === 'hsb' ? (
        <SplitInputGroup>
          <SplitInput value={hsb.h} onChange={(v) => handleHsbChange('h', v)} />
          <SplitInput value={hsb.s} onChange={(v) => handleHsbChange('s', v)} />
          <SplitInput value={hsb.b} onChange={(v) => handleHsbChange('b', v)} />
        </SplitInputGroup>
      ) : null}
      {mode === 'hsl' ? (
        <SplitInputGroup>
          <SplitInput value={hsl.h} onChange={(v) => handleHslChange('h', v)} />
          <SplitInput value={hsl.s} onChange={(v) => handleHslChange('s', v)} />
          <SplitInput value={hsl.l} onChange={(v) => handleHslChange('l', v)} />
        </SplitInputGroup>
      ) : null}

      {showAlpha ? (
        <div className="flex shrink-0 items-center rounded-r bg-tertiary">
          <input
            type="number"
            value={alpha}
            onChange={(e) => handleAlphaInput(e.target.value)}
            min={0}
            max={100}
            className="w-8 min-w-0 bg-transparent py-1 text-center text-sm text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pr-1 text-sm text-tertiary">%</span>
        </div>
      ) : null}
    </div>
  );
}

function SplitInputGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-stretch bg-tertiary [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-primary">
      {children}
    </div>
  );
}

function SplitInput({ value, onChange }: { value: number; onChange: (v: string) => void }) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <input
      type="number"
      value={value}
      onChange={handleChange}
      className="w-full min-w-0 bg-transparent px-1 py-1 text-center text-sm text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

function MiniHexInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const display = value.startsWith('#') ? value.slice(1).toUpperCase() : value.toUpperCase();
  const [draft, setDraft] = useState(display);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(display);
  }, [display, editing]);

  function handleFocus() {
    setEditing(true);
    setDraft(display);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase());
  }

  function handleBlur() {
    setEditing(false);
    if (draft.length >= 6) onCommit(draft);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
  }

  return (
    <div className="flex min-w-0 flex-1 items-center bg-tertiary">
      <input
        type="text"
        value={editing ? draft : display}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        maxLength={8}
        className="w-full min-w-0 bg-transparent px-1.5 py-1 text-center font-mono text-sm text-primary outline-none"
      />
    </div>
  );
}
