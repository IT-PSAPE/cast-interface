import { hueToHex } from '../../../utils/color';
import { usePointerCapture } from './use-pointer-capture';

interface HueSliderProps {
  hue: number;
  onChange: (h: number) => void;
}

export function HueSlider({ hue, onChange }: HueSliderProps) {
  const { ref, handlePointerDown, handlePointerMove, handlePointerUp } = usePointerCapture((event) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onChange(Math.round(x * 360));
  });

  const thumbLeft = `${(hue / 360) * 100}%`;

  return (
    <div
      ref={ref}
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
