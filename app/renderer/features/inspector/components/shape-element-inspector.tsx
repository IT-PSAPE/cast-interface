import { applyVisualPayload, readVisualPayload, type VisualPayloadState } from '@core/element-payload';
import { parseNumber } from '../../../utils/slides';
import { useElements } from '../../../contexts/element/element-context';
import type { StrokePosition } from '@core/types';
import { ColorPicker } from '../../../components/form/color-picker';
import { FieldInput, FieldSelect } from '../../../components/form/labeled-field';
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal,
  AlignEndVertical, AlignStartHorizontal, AlignStartVertical,
  CornerUpRight, Eye, FlipHorizontal2, MoveHorizontal, MoveVertical,
  RotateCcw, RulerDimensionLine, Square, Sun,
} from 'lucide-react';
import type { ElementInspectorDraft } from '../../../types/ui';
import { IconGroup } from '@renderer/components/icon-group';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { alignElementDraft } from '../utils/align-element-draft';
import { Section } from './inspector-section';

const STROKE_POSITION_OPTIONS = [
  { value: 'inside', label: 'Inside' },
  { value: 'center', label: 'Center' },
  { value: 'outside', label: 'Outside' },
];

export function ShapeElementInspector() {
  const {
    selectedElement,
    elementDraft,
    elementPayloadDraft,
    lockAspectRatio,
    setElementDraft,
    setElementPayloadDraft,
  } = useElements();
  const { editScene } = useRenderScenes();

  if (!selectedElement || !elementDraft || !elementPayloadDraft) {
    return <div className="text-sm text-text-tertiary">Select an object to edit shape properties.</div>;
  }

  const activeElement = selectedElement;
  const activePayload = elementPayloadDraft;
  const visual = readVisualPayload(activeElement.type, activePayload);
  const styleLabelPrefix = activeElement.type === 'text' ? 'Box ' : '';

  function updateDraft(transform: (current: ElementInspectorDraft) => ElementInspectorDraft) {
    setElementDraft((current) => (current ? transform(current) : current));
  }

  function updateVisual(patch: Partial<VisualPayloadState>) {
    const nextVisual = { ...readVisualPayload(activeElement.type, activePayload), ...patch };
    setElementPayloadDraft(applyVisualPayload(activeElement.type, activePayload, nextVisual));
  }

  function handleXChange(value: string) { updateDraft((current) => ({ ...current, x: parseNumber(value, current.x) })); }
  function handleYChange(value: string) { updateDraft((current) => ({ ...current, y: parseNumber(value, current.y) })); }
  function handleWChange(value: string) {
    updateDraft((current) => {
      const nextWidth = Math.max(1, parseNumber(value, current.width));
      if (!lockAspectRatio || current.height <= 0) return { ...current, width: nextWidth };
      const ratio = current.width / current.height || 1;
      return { ...current, width: nextWidth, height: Math.max(1, nextWidth / ratio) };
    });
  }
  function handleHChange(value: string) {
    updateDraft((current) => {
      const nextHeight = Math.max(1, parseNumber(value, current.height));
      if (!lockAspectRatio || current.width <= 0) return { ...current, height: nextHeight };
      const ratio = current.width / current.height || 1;
      return { ...current, height: nextHeight, width: Math.max(1, nextHeight * ratio) };
    });
  }
  function handleRotationChange(value: string) { updateDraft((current) => ({ ...current, rotation: parseNumber(value, current.rotation) })); }
  function handleOpacityChange(value: string) {
    updateDraft((current) => ({ ...current, opacity: Math.max(0, Math.min(1, parseNumber(value, current.opacity * 100) / 100)) }));
  }
  function handleAlignLeft() { updateDraft((current) => alignElementDraft(current, editScene.width, editScene.height, 'left')); }
  function handleAlignCenter() { updateDraft((current) => alignElementDraft(current, editScene.width, editScene.height, 'center')); }
  function handleAlignRight() { updateDraft((current) => alignElementDraft(current, editScene.width, editScene.height, 'right')); }
  function handleAlignTop() { updateDraft((current) => alignElementDraft(current, editScene.width, editScene.height, 'top')); }
  function handleAlignMiddle() { updateDraft((current) => alignElementDraft(current, editScene.width, editScene.height, 'middle')); }
  function handleAlignBottom() { updateDraft((current) => alignElementDraft(current, editScene.width, editScene.height, 'bottom')); }
  function handleFlipX() { updateVisual({ flipX: !visual.flipX }); }
  function handleFlipY() { updateVisual({ flipY: !visual.flipY }); }
  function handleFillToggle(enabled: boolean) { updateVisual({ fillEnabled: enabled }); }
  function handleFillColorChange(value: string) { updateVisual({ fillColor: value }); }
  function handleStrokeToggle(enabled: boolean) { updateVisual({ strokeEnabled: enabled }); }
  function handleStrokeColorChange(value: string) { updateVisual({ strokeColor: value }); }
  function handleStrokeWidthChange(value: string) { updateVisual({ strokeWidth: Math.max(0, parseNumber(value, visual.strokeWidth)) }); }
  function handleStrokePositionChange(value: string) { updateVisual({ strokePosition: value as StrokePosition }); }
  function handleShadowToggle(enabled: boolean) { updateVisual({ shadowEnabled: enabled }); }
  function handleShadowColorChange(value: string) { updateVisual({ shadowColor: value }); }
  function handleShadowBlurChange(value: string) { updateVisual({ shadowBlur: Math.max(0, parseNumber(value, visual.shadowBlur)) }); }
  function handleShadowOffsetXChange(value: string) { updateVisual({ shadowOffsetX: parseNumber(value, visual.shadowOffsetX) }); }
  function handleShadowOffsetYChange(value: string) { updateVisual({ shadowOffsetY: parseNumber(value, visual.shadowOffsetY) }); }

  return (
    <fieldset className={`m-0 min-w-0 border-0 p-0 ${visual.locked ? 'opacity-50' : ''}`} disabled={visual.locked}>
      <Section.Root>
        <Section.Header>
          <span>Position</span>
        </Section.Header>
        <Section.Body>
          <Section.Row>
            <IconGroup.Root fill>
              <IconGroup.Item onClick={handleAlignLeft} title="Align left" aria-label="Align left">
                <AlignStartHorizontal />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignCenter} title="Align center" aria-label="Align center">
                <AlignCenterHorizontal />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignRight} title="Align right" aria-label="Align right">
                <AlignEndHorizontal />
              </IconGroup.Item>
            </IconGroup.Root>
            <IconGroup.Root fill>
              <IconGroup.Item onClick={handleAlignTop} title="Align top" aria-label="Align top">
                <AlignStartVertical />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignMiddle} title="Align middle" aria-label="Align middle">
                <AlignCenterVertical />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignBottom} title="Align bottom" aria-label="Align bottom">
                <AlignEndVertical />
              </IconGroup.Item>
            </IconGroup.Root>
          </Section.Row>
          <Section.Row>
            <FieldInput icon={<MoveHorizontal size={14} />} type="number" value={Math.round(elementDraft.x)} onChange={handleXChange} />
            <FieldInput icon={<MoveVertical size={14} />} type="number" value={Math.round(elementDraft.y)} onChange={handleYChange} />
          </Section.Row>
          <Section.Row>
            <FieldInput icon={<RotateCcw size={14} />} type="number" value={Math.round(elementDraft.rotation)} onChange={handleRotationChange} />
            <IconGroup.Root fill>
              <IconGroup.Item>
                <CornerUpRight />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleFlipX}>
                <FlipHorizontal2 />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleFlipY}>
                <FlipHorizontal2 className='rotate-90' />
              </IconGroup.Item>
            </IconGroup.Root>
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Layout</span>
        </Section.Header>
        <Section.Body>
          <Section.Row>
            <FieldInput icon={<MoveHorizontal size={14} />} type="number" value={Math.round(elementDraft.width)} onChange={handleWChange} />
            <FieldInput icon={<MoveVertical size={14} />} type="number" value={Math.round(elementDraft.height)} onChange={handleHChange} />
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Appearance</span>
        </Section.Header>
        <Section.Body>
          <Section.Row>
            <FieldInput icon={<Eye size={14} />} type="number" value={Math.round(elementDraft.opacity * 100)} onChange={handleOpacityChange} min={0} max={100} step={1} />
            <FieldInput icon={<Square size={14} />} type="number" value={0} onChange={() => { }} min={0} max={100} step={1} />
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <Section.Checkbox checked={visual.fillEnabled} onChange={handleFillToggle} />
          <span className='font-medium ml-2'>{`${styleLabelPrefix}Fill`}</span>
        </Section.Header>
        {visual.fillEnabled ? (
          <Section.Body>
            <Section.Row lead>
              <ColorPicker value={visual.fillColor} onChange={handleFillColorChange} />
            </Section.Row>
          </Section.Body>
        ) : null}
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <Section.Checkbox checked={visual.strokeEnabled} onChange={handleStrokeToggle} />
          <span className='font-medium ml-2'>{`${styleLabelPrefix}Stroke`}</span>
        </Section.Header>
        {visual.strokeEnabled ? (
          <Section.Body>
            <Section.Row lead>
              <ColorPicker value={visual.strokeColor} onChange={handleStrokeColorChange} />
            </Section.Row>
            <Section.Row>
              <FieldSelect value={visual.strokePosition} onChange={handleStrokePositionChange} options={STROKE_POSITION_OPTIONS} />
              <FieldInput icon={<RulerDimensionLine size={14} />} type="number" value={visual.strokeWidth} onChange={handleStrokeWidthChange} />
            </Section.Row>
          </Section.Body>
        ) : null}
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <Section.Checkbox checked={visual.shadowEnabled} onChange={handleShadowToggle} />
          <span className='font-medium ml-2'>{`${styleLabelPrefix}Shadow`}</span>
        </Section.Header>
        {visual.shadowEnabled ? (
          <Section.Body>
            <Section.Row>
              <FieldInput icon={<MoveHorizontal size={14} />} type="number" value={visual.shadowOffsetX} onChange={handleShadowOffsetXChange} />
              <FieldInput icon={<MoveVertical size={14} />} type="number" value={visual.shadowOffsetY} onChange={handleShadowOffsetYChange} />
            </Section.Row>
            <Section.Row>
              <FieldInput icon={<Sun size={14} />} type="number" value={visual.shadowBlur} onChange={handleShadowBlurChange} />
            </Section.Row>
            <Section.Row lead>
              <ColorPicker value={visual.shadowColor} onChange={handleShadowColorChange} />
            </Section.Row>
          </Section.Body>
        ) : null}
      </Section.Root>

    </fieldset>
  );
}
