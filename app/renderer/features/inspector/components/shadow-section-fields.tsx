import { MoveHorizontal, MoveVertical, Sun } from 'lucide-react';
import { ColorPicker } from '../../../components/form/color-picker';
import { FieldInput } from '../../../components/form/field-input';
import { Section } from './inspector-section';
import { parseNumber } from '../../../utils/slides';

interface ShadowSectionFieldsProps {
  label: string;
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  onToggle: (enabled: boolean) => void;
  onUpdate: (patch: { shadowEnabled?: boolean; shadowColor?: string; shadowBlur?: number; shadowOffsetX?: number; shadowOffsetY?: number }) => void;
}

export function ShadowSectionFields({ label, enabled, color, blur, offsetX, offsetY, onToggle, onUpdate }: ShadowSectionFieldsProps) {
  function handleColorChange(value: string) { onUpdate({ shadowColor: value }); }
  function handleBlurChange(value: string) { onUpdate({ shadowBlur: Math.max(0, parseNumber(value, blur)) }); }
  function handleOffsetXChange(value: string) { onUpdate({ shadowOffsetX: parseNumber(value, offsetX) }); }
  function handleOffsetYChange(value: string) { onUpdate({ shadowOffsetY: parseNumber(value, offsetY) }); }

  return (
    <Section.Root>
      <Section.Header>
        <Section.Checkbox checked={enabled} onChange={onToggle} />
        <span className="font-medium ml-2">{label}</span>
      </Section.Header>
      {enabled ? (
        <Section.Body>
          <Section.Row>
            <FieldInput icon={<MoveHorizontal size={14} />} type="number" value={offsetX} onChange={handleOffsetXChange} />
            <FieldInput icon={<MoveVertical size={14} />} type="number" value={offsetY} onChange={handleOffsetYChange} />
          </Section.Row>
          <Section.Row>
            <FieldInput icon={<Sun size={14} />} type="number" value={blur} onChange={handleBlurChange} />
          </Section.Row>
          <Section.Row lead>
            <ColorPicker value={color} onChange={handleColorChange} />
          </Section.Row>
        </Section.Body>
      ) : null}
    </Section.Root>
  );
}
