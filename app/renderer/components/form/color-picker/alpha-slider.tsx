import { hsbToHex, type Hsb } from '../../../utils/color';
import { usePointerCapture } from './use-pointer-capture';

interface AlphaSliderProps {
  hsb: Hsb;
  alpha: number;
  onChange: (a: number) => void;
}

export function AlphaSlider({ hsb, alpha, onChange }: AlphaSliderProps) {
  const solidHex = hsbToHex(hsb);

  const { ref, handlePointerDown, handlePointerMove, handlePointerUp } = usePointerCapture((event) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onChange(Math.round(x * 100));
  });

  const thumbLeft = `${alpha}%`;

  return (
    <div
      ref={ref}
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
