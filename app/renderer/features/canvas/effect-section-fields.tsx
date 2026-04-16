import type { StrokePosition } from '@core/types';
import { MoveHorizontal, MoveVertical, RulerDimensionLine, Sun } from 'lucide-react';
import { ColorPicker } from '../../components/form/color-picker';
import { FieldIcon, FieldInput, FieldSelect } from '../../components/form/field';
import { Section } from './inspector-section';
import { parseNumber } from '../../utils/slides';

// ─── Stroke Fields ───────────────────────────────────

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
            <FieldInput type="number" value={width} onChange={handleWidthChange}>
              <FieldIcon><RulerDimensionLine size={14} /></FieldIcon>
            </FieldInput>
          </Section.Row>
        </Section.Body>
      ) : null}
    </Section.Root>
  );
}

// ─── Shadow Fields ───────────────────────────────────

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
            <FieldInput type="number" value={offsetX} onChange={handleOffsetXChange}>
              <FieldIcon><MoveHorizontal size={14} /></FieldIcon>
            </FieldInput>
            <FieldInput type="number" value={offsetY} onChange={handleOffsetYChange}>
              <FieldIcon><MoveVertical size={14} /></FieldIcon>
            </FieldInput>
          </Section.Row>
          <Section.Row>
            <FieldInput type="number" value={blur} onChange={handleBlurChange}>
              <FieldIcon><Sun size={14} /></FieldIcon>
            </FieldInput>
          </Section.Row>
          <Section.Row lead>
            <ColorPicker value={color} onChange={handleColorChange} />
          </Section.Row>
        </Section.Body>
      ) : null}
    </Section.Root>
  );
}
