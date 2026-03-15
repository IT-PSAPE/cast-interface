import { useCallback, useEffect, useRef, useState } from 'react';
import {
  hexAlpha, hexToHsb, hsbToHex, hsbToRgb, hueToHex,
  rgbToHex, rgbToHsb, rgbToHsl, hslToRgb, withAlpha,
  type Hsb, type Rgb, type Hsl,
} from '../utils/color';
import { Popover } from './popover';

type ColorMode = 'hex' | 'rgb' | 'hsb' | 'hsl';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  showAlpha?: boolean;
}

export function ColorPicker({ value, onChange, showAlpha = true }: ColorPickerProps) {
  const safeValue = value && value.length >= 4 ? value : '#000000';
  const [hsb, setHsb] = useState<Hsb>(() => hexToHsb(safeValue));
  const [alpha, setAlpha] = useState(() => hexAlpha(safeValue));
  const [mode, setMode] = useState<ColorMode>('hex');
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const incoming = hexToHsb(safeValue);
    const incomingAlpha = hexAlpha(safeValue);
    setHsb((prev) => {
      if (prev.h === incoming.h && prev.s === incoming.s && prev.b === incoming.b) return prev;
      return incoming;
    });
    setAlpha(incomingAlpha);
  }, [safeValue]);

  const emit = useCallback((nextHsb: Hsb, nextAlpha: number) => {
    const hex = hsbToHex(nextHsb);
    onChange(withAlpha(hex, nextAlpha));
  }, [onChange]);

  function handleHsbChange(next: Hsb) {
    setHsb(next);
    emit(next, alpha);
  }

  function handleAlphaChange(next: number) {
    setAlpha(next);
    emit(hsb, next);
  }

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  function handleClose() {
    setIsOpen(false);
  }

  const previewHex = hsbToHex(hsb);
  const displayAlpha = showAlpha ? alpha : 100;
  const displayHexValue = withAlpha(previewHex, displayAlpha);

  return (
    <div className="flex min-w-0 w-full items-center gap-1.5 min-h-8 rounded bg-tertiary text-sm text-text-primary transition-colors focus-within:border-brand">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="ml-1.5 size-5 shrink-0 overflow-hidden rounded border border-border-primary cursor-pointer"
        style={{
          backgroundImage: 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%)',
          backgroundSize: '8px 8px',
        }}
      >
        <span className="block size-full" style={{ backgroundColor: previewHex, opacity: displayAlpha / 100 }} />
      </button>
      <span className="text-text-tertiary text-sm select-none">#</span>
      <HexInput value={displayHexValue} onChange={onChange} />

      <Popover anchor={triggerRef.current} open={isOpen} onClose={handleClose} placement="bottom" className="w-56 rounded-lg border border-border-primary bg-primary p-2.5 shadow-lg">
        <SaturationBrightnessArea hsb={hsb} onChange={handleHsbChange} />
        <HueSlider hue={hsb.h} onChange={(h) => handleHsbChange({ ...hsb, h })} />
        {showAlpha ? <AlphaSlider hsb={hsb} alpha={alpha} onChange={handleAlphaChange} /> : null}
        <ColorModeInputs hsb={hsb} alpha={alpha} mode={mode} showAlpha={showAlpha} onHsbChange={handleHsbChange} onAlphaChange={handleAlphaChange} onModeChange={setMode} />
      </Popover>
    </div>
  );
}

// ── Hex inline input ───────────────────────────────────────

function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  const display = value.startsWith('#') ? value.slice(1).toUpperCase() : value.toUpperCase();

  function handleFocus() {
    setDraft(display);
    setEditing(true);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/[^0-9a-fA-F]/g, '');
    setDraft(raw.toUpperCase());
  }

  function handleBlur() {
    setEditing(false);
    if (draft.length >= 6) {
      onChange(`#${draft.slice(0, 8)}`);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    }
  }

  return (
    <input
      type="text"
      value={editing ? draft : display}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      maxLength={8}
      className="min-w-0 w-full bg-transparent py-1 pr-2 outline-none font-mono text-sm"
    />
  );
}

// ── Saturation / Brightness area ───────────────────────────

function SaturationBrightnessArea({ hsb, onChange }: { hsb: Hsb; onChange: (hsb: Hsb) => void }) {
  const areaRef = useRef<HTMLDivElement>(null);

  function resolveFromPointer(event: PointerEvent | React.PointerEvent) {
    const rect = areaRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    onChange({ h: hsb.h, s: Math.round(x * 100), b: Math.round((1 - y) * 100) });
  }

  function handlePointerDown(event: React.PointerEvent) {
    event.preventDefault();
    areaRef.current!.setPointerCapture(event.pointerId);
    resolveFromPointer(event);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!areaRef.current!.hasPointerCapture(event.pointerId)) return;
    resolveFromPointer(event);
  }

  function handlePointerUp(event: React.PointerEvent) {
    areaRef.current!.releasePointerCapture(event.pointerId);
  }

  const hueColor = hueToHex(hsb.h);
  const thumbX = `${hsb.s}%`;
  const thumbY = `${100 - hsb.b}%`;

  return (
    <div
      ref={areaRef}
      className="relative mb-2 h-36 w-full cursor-crosshair rounded select-none overflow-hidden"
      style={{ backgroundColor: hueColor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* White → transparent horizontal gradient */}
      <div className="pointer-events-none absolute inset-0 rounded" style={{ background: 'linear-gradient(to right, white, transparent)' }} />
      {/* Transparent → black vertical gradient */}
      <div className="pointer-events-none absolute inset-0 rounded" style={{ background: 'linear-gradient(to bottom, transparent, black)' }} />
      {/* Thumb */}
      <div
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: thumbX, top: thumbY, backgroundColor: hsbToHex(hsb) }}
      />
    </div>
  );
}

// ── Hue slider ─────────────────────────────────────────────

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function resolveFromPointer(event: PointerEvent | React.PointerEvent) {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onChange(Math.round(x * 360));
  }

  function handlePointerDown(event: React.PointerEvent) {
    event.preventDefault();
    trackRef.current!.setPointerCapture(event.pointerId);
    resolveFromPointer(event);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!trackRef.current!.hasPointerCapture(event.pointerId)) return;
    resolveFromPointer(event);
  }

  function handlePointerUp(event: React.PointerEvent) {
    trackRef.current!.releasePointerCapture(event.pointerId);
  }

  const thumbLeft = `${(hue / 360) * 100}%`;

  return (
    <div
      ref={trackRef}
      className="relative mb-2 h-3 w-full cursor-pointer rounded-full select-none"
      style={{ background: 'linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: thumbLeft, backgroundColor: hueToHex(hue) }}
      />
    </div>
  );
}

// ── Alpha slider ───────────────────────────────────────────

function AlphaSlider({ hsb, alpha, onChange }: { hsb: Hsb; alpha: number; onChange: (a: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const solidHex = hsbToHex(hsb);

  function resolveFromPointer(event: PointerEvent | React.PointerEvent) {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onChange(Math.round(x * 100));
  }

  function handlePointerDown(event: React.PointerEvent) {
    event.preventDefault();
    trackRef.current!.setPointerCapture(event.pointerId);
    resolveFromPointer(event);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!trackRef.current!.hasPointerCapture(event.pointerId)) return;
    resolveFromPointer(event);
  }

  function handlePointerUp(event: React.PointerEvent) {
    trackRef.current!.releasePointerCapture(event.pointerId);
  }

  const thumbLeft = `${alpha}%`;

  return (
    <div
      ref={trackRef}
      className="relative mb-2 h-3 w-full cursor-pointer rounded-full select-none"
      style={{
        backgroundImage: `linear-gradient(to right, transparent, ${solidHex}), repeating-conic-gradient(#ccc 0% 25%, white 0% 50%)`,
        backgroundSize: '100% 100%, 8px 8px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: thumbLeft, backgroundColor: solidHex }}
      />
    </div>
  );
}

// ── Color mode inputs ──────────────────────────────────────

interface ColorModeInputsProps {
  hsb: Hsb;
  alpha: number;
  mode: ColorMode;
  showAlpha: boolean;
  onHsbChange: (hsb: Hsb) => void;
  onAlphaChange: (a: number) => void;
  onModeChange: (mode: ColorMode) => void;
}

function ColorModeInputs({ hsb, alpha, mode, showAlpha, onHsbChange, onAlphaChange, onModeChange }: ColorModeInputsProps) {
  const rgb = hsbToRgb(hsb);
  const hsl = rgbToHsl(rgb);

  function handleModeSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    onModeChange(event.target.value as ColorMode);
  }

  function handleRgbChange(channel: keyof Rgb, value: string) {
    const n = clampInt(value, 0, 255);
    const nextRgb = { ...rgb, [channel]: n };
    onHsbChange(rgbToHsb(nextRgb));
  }

  function handleHsbChange(channel: keyof Hsb, value: string) {
    const max = channel === 'h' ? 360 : 100;
    const n = clampInt(value, 0, max);
    onHsbChange({ ...hsb, [channel]: n });
  }

  function handleHslChange(channel: keyof Hsl, value: string) {
    const max = channel === 'h' ? 360 : 100;
    const n = clampInt(value, 0, max);
    const nextHsl = { ...hsl, [channel]: n };
    onHsbChange(rgbToHsb(hslToRgb(nextHsl)));
  }

  function handleHexCommit(value: string) {
    const raw = value.replace(/[^0-9a-fA-F]/g, '');
    if (raw.length >= 6) {
      const hex = `#${raw.slice(0, 6)}`;
      onHsbChange(hexToHsb(hex));
      if (raw.length >= 8) {
        const a = parseInt(raw.slice(6, 8), 16);
        onAlphaChange(Math.round((a / 255) * 100));
      }
    }
  }

  function handleAlphaInput(value: string) {
    onAlphaChange(clampInt(value, 0, 100));
  }

  return (
    <div className="flex items-stretch gap-px">
      {/* Mode dropdown */}
      <select
        value={mode}
        onChange={handleModeSelect}
        className="shrink-0 cursor-pointer rounded-l bg-tertiary px-1.5 py-1 text-sm font-medium text-text-secondary outline-none"
      >
        <option value="hex">Hex</option>
        <option value="rgb">RGB</option>
        <option value="hsb">HSB</option>
        <option value="hsl">HSL</option>
      </select>

      {/* Value inputs — grouped in a connected container */}
      {mode === 'hex' ? (
        <MiniHexInput value={rgbToHex(rgb)} onCommit={handleHexCommit} />
      ) : null}
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

      {/* Opacity — separated by 1px gap */}
      {showAlpha ? (
        <div className="flex shrink-0 items-center rounded-r bg-tertiary">
          <input
            type="number"
            value={alpha}
            onChange={(e) => handleAlphaInput(e.target.value)}
            min={0}
            max={100}
            className="w-8 min-w-0 bg-transparent py-1 text-center text-sm text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pr-1 text-sm text-text-tertiary">%</span>
        </div>
      ) : null}
    </div>
  );
}

// ── Split inputs ───────────────────────────────────────────

function SplitInputGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-stretch bg-tertiary [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-border-primary">
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
      className="w-full min-w-0 bg-transparent px-1 py-1 text-center text-sm text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
        className="w-full min-w-0 bg-transparent px-1.5 py-1 text-center font-mono text-sm text-text-primary outline-none"
      />
    </div>
  );
}

function clampInt(value: string, min: number, max: number): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
