import type { StrokePosition } from '@core/types';
import { RulerDimensionLine } from 'lucide-react';
import { ColorPicker } from '../../components/form/color-picker';
import { FieldInput } from '../../components/form/field-input';
import { FieldSelect } from '../../components/form/field-select';
import { Section } from './inspector-section';
import { parseNumber } from '../../utils/slides';

const STROKE_POSITION_OPTIONS = [
  { value: 'inside', label: 'Inside' },
  { value: 'center', label: 'Center' },
  { value: 'outside', label: 'Outside' },
];

interface StrokeSectionFieldsProps {
  label: string;
  enabled: boolean;
  color: string;
  width: number;
  position: StrokePosition;
  onToggle: (enabled: boolean) => void;
  onUpdate: (patch: { strokeEnabled?: boolean; strokeColor?: string; strokeWidth?: number; strokePosition?: StrokePosition }) => void;
}

export function StrokeSectionFields({ label, enabled, color, width, position, onToggle, onUpdate }: StrokeSectionFieldsProps) {
  function handleColorChange(value: string) { onUpdate({ strokeColor: value }); }
  function handleWidthChange(value: string) { onUpdate({ strokeWidth: Math.max(0, parseNumber(value, width)) }); }
  function handlePositionChange(value: string) { onUpdate({ strokePosition: value as StrokePosition }); }

  return (
    <Section.Root>
      <Section.Header>
        <Section.Checkbox checked={enabled} onChange={onToggle} />
        <span className="font-medium ml-2">{label}</span>
      </Section.Header>
      {enabled ? (
        <Section.Body>
          <Section.Row lead>
            <ColorPicker value={color} onChange={handleColorChange} />
          </Section.Row>
          <Section.Row>
            <FieldSelect value={position} onChange={handlePositionChange} options={STROKE_POSITION_OPTIONS} />
            <FieldInput icon={<RulerDimensionLine size={14} />} type="number" value={width} onChange={handleWidthChange} />
          </Section.Row>
        </Section.Body>
      ) : null}
    </Section.Root>
  );
}
