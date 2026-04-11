import { hsbToHex, hueToHex, type Hsb } from '../../../utils/color';
import { usePointerCapture } from './use-pointer-capture';

interface SaturationBrightnessAreaProps {
  hsb: Hsb;
  onChange: (hsb: Hsb) => void;
}

export function SaturationBrightnessArea({ hsb, onChange }: SaturationBrightnessAreaProps) {
  const { ref, handlePointerDown, handlePointerMove, handlePointerUp } = usePointerCapture((event) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    onChange({ h: hsb.h, s: Math.round(x * 100), b: Math.round((1 - y) * 100) });
  });

  const hueColor = hueToHex(hsb.h);
  const thumbX = `${hsb.s}%`;
  const thumbY = `${100 - hsb.b}%`;

  return (
    <div
      ref={ref}
      className="relative mb-2 h-36 w-full cursor-crosshair rounded select-none overflow-hidden"
      style={{ backgroundColor: hueColor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="pointer-events-none absolute inset-0 rounded" style={{ background: 'linear-gradient(to right, white, transparent)' }} />
      <div className="pointer-events-none absolute inset-0 rounded" style={{ background: 'linear-gradient(to bottom, transparent, black)' }} />
      <div
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: thumbX, top: thumbY, backgroundColor: hsbToHex(hsb) }}
      />
    </div>
  );
}
