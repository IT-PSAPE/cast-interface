import { applyVisualPayload, readVisualPayload, supportsVisualStyling, type VisualPayloadState } from '@core/element-payload';
import { parseNumber } from '../../../utils/slides';
import { useElements } from '../../../contexts/element-context';
import { Button } from '../../../components/button';
import { CheckboxField } from '../../../components/checkbox-field';
import { FieldColor, FieldInput } from '../../../components/labeled-field';
import { CheckboxSection } from '../../../components/checkbox-section';
import type { ElementInspectorDraft } from '../../../types/ui';
import { Move } from '@renderer/components/icon/move';
import { SpacingWidth01 } from '@renderer/components/icon/spacing-width-01';
import { SpacingHeight01 } from '@renderer/components/icon/spacing-height-01';
import { RefreshCcw04 } from '@renderer/components/icon/refresh-ccw-04';
import { Eye } from '@renderer/components/icon/eye';
import { IconGroup } from '@renderer/components/icon-group';
import { Placeholder } from '@renderer/components/icon/placeholder';
import { AlignLeft02 } from '@renderer/components/icon/align-left-02';
import { AlignHorizontalCentre02 } from '@renderer/components/icon/align-horizontal-centre-02';
import { AlignRight02 } from '@renderer/components/icon/align-right-02';
import { AlignTop01 } from '@renderer/components/icon/align-top-01';
import { AlignTop02 } from '@renderer/components/icon/align-top-02';
import { AlignVerticalCenter02 } from '@renderer/components/icon/align-vertical-center-02';
import { AlignBottom02 } from '@renderer/components/icon/align-bottom-02';
import { Reflect01 } from '@renderer/components/icon/reflect-01';
import { CornerUpRight } from '@renderer/components/icon/corner-up-right';
import { cn } from '@renderer/utils/cn';
import { Square } from '@renderer/components/icon/square';
import { Check } from '@renderer/components/icon/check';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { alignElementDraft } from '../utils/align-element-draft';

export function ShapeElementInspector() {
  const {
    selectedElement,
    elementDraft,
    elementPayloadDraft,
    lockAspectRatio,
    setElementDraft,
    setElementPayloadDraft,
    setLockAspectRatio,
  } = useElements();
  const { editScene } = useRenderScenes();

  if (!selectedElement || !elementDraft || !elementPayloadDraft) {
    return <div className="text-[12px] text-text-tertiary">Select an object to edit shape properties.</div>;
  }

  const activeElement = selectedElement;
  const activePayload = elementPayloadDraft;
  const visual = readVisualPayload(activeElement.type, activePayload);
  const canStyle = supportsVisualStyling(activeElement.type);
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
  function handleShadowToggle(enabled: boolean) { updateVisual({ shadowEnabled: enabled }); }
  function handleShadowColorChange(value: string) { updateVisual({ shadowColor: value }); }
  function handleShadowBlurChange(value: string) { updateVisual({ shadowBlur: Math.max(0, parseNumber(value, visual.shadowBlur)) }); }
  function handleShadowOffsetXChange(value: string) { updateVisual({ shadowOffsetX: parseNumber(value, visual.shadowOffsetX) }); }
  function handleShadowOffsetYChange(value: string) { updateVisual({ shadowOffsetY: parseNumber(value, visual.shadowOffsetY) }); }

  return (
    <fieldset className={`m-0 min-w-0 border-0 p-0 ${visual.locked ? 'opacity-50' : ''}`} disabled={visual.locked}>
      <InspectorSection>
        <InspectorSectionHeader>
          <span>Position</span>
        </InspectorSectionHeader>
        <InspectorSectionBody>
          <InspectorSectionRow>
            <IconGroup.Root fill>
              <IconGroup.Item onClick={handleAlignLeft} title="Align left" aria-label="Align left">
                <AlignLeft02 />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignCenter} title="Align center" aria-label="Align center">
                <AlignHorizontalCentre02 />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignRight} title="Align right" aria-label="Align right">
                <AlignRight02 />
              </IconGroup.Item>
            </IconGroup.Root>
            <IconGroup.Root fill>
              <IconGroup.Item onClick={handleAlignTop} title="Align top" aria-label="Align top">
                <AlignTop02 />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignMiddle} title="Align middle" aria-label="Align middle">
                <AlignVerticalCenter02 />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignBottom} title="Align bottom" aria-label="Align bottom">
                <AlignBottom02 />
              </IconGroup.Item>
            </IconGroup.Root>
          </InspectorSectionRow>
          <InspectorSectionRow>
            <FieldInput icon={<Move size={14} />} type="number" value={Math.round(elementDraft.x)} onChange={handleXChange} />
            <FieldInput icon={<Move size={14} />} type="number" value={Math.round(elementDraft.y)} onChange={handleYChange} />
          </InspectorSectionRow>
          <InspectorSectionRow>
            <FieldInput icon={<RefreshCcw04 size={14} />} type="number" value={Math.round(elementDraft.rotation)} onChange={handleRotationChange} />
            <IconGroup.Root fill>
              <IconGroup.Item>
                <CornerUpRight />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleFlipX}>
                <Reflect01 />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleFlipY}>
                <Reflect01 className='rotate-90' />
              </IconGroup.Item>
            </IconGroup.Root>
          </InspectorSectionRow>
        </InspectorSectionBody>
      </InspectorSection>

      <InspectorSection >
        <InspectorSectionHeader >
          <span>Layout</span>
        </InspectorSectionHeader>
        <InspectorSectionBody >
          <InspectorSectionRow >
            <FieldInput icon={<SpacingWidth01 size={14} />} type="number" value={Math.round(elementDraft.width)} onChange={handleWChange} />
            <FieldInput icon={<SpacingHeight01 size={14} />} type="number" value={Math.round(elementDraft.height)} onChange={handleHChange} />
          </InspectorSectionRow>
        </InspectorSectionBody>
      </InspectorSection>

      <InspectorSection>
        <InspectorSectionHeader>
          <span>Appearance</span>
        </InspectorSectionHeader>
        <InspectorSectionBody>
          <InspectorSectionRow>
            <FieldInput icon={<Eye size={14} />} type="number" value={Math.round(elementDraft.opacity * 100)} onChange={handleOpacityChange} min={0} max={100} step={1} />
            <FieldInput icon={<Square size={14} />} type="number" value={0} onChange={() => { }} min={0} max={100} step={1} />
          </InspectorSectionRow>
        </InspectorSectionBody>
      </InspectorSection>

      <InspectorSection>
        <InspectorSectionHeader>
          <Checkbox checked={visual.fillEnabled} onChange={handleFillToggle} />
          <span className='font-medium ml-2'>{`${styleLabelPrefix}Fill`}</span>
        </InspectorSectionHeader>
        <InspectorSectionBody show={visual.fillEnabled}>
          <InspectorSectionRow lead>
            <FieldColor value={visual.fillColor} onChange={handleFillColorChange} />
          </InspectorSectionRow>
        </InspectorSectionBody>
      </InspectorSection>

      <InspectorSection>
        <InspectorSectionHeader>
          <Checkbox checked={visual.strokeEnabled} onChange={handleStrokeToggle} />
          <span className='font-medium ml-2'>{`${styleLabelPrefix}Stroke`}</span>
        </InspectorSectionHeader>
        <InspectorSectionBody show={visual.strokeEnabled}>
          <InspectorSectionRow>
            <FieldColor value={visual.strokeColor} onChange={handleStrokeColorChange} />
            <FieldInput type="number" value={visual.strokeWidth} onChange={handleStrokeWidthChange} />
          </InspectorSectionRow>
        </InspectorSectionBody>
      </InspectorSection>

      <InspectorSection>
        <InspectorSectionHeader>
          <Checkbox checked={visual.shadowEnabled} onChange={handleShadowToggle} />
          <span className='font-medium ml-2'>{`${styleLabelPrefix}Shadow`}</span>
        </InspectorSectionHeader>
        <InspectorSectionBody show={visual.shadowEnabled}>
          <InspectorSectionRow lead>
            <FieldColor value={visual.shadowColor} onChange={handleShadowColorChange} />
          </InspectorSectionRow>
          <InspectorSectionRow lead>
            <FieldInput type="number" value={visual.shadowBlur} onChange={handleShadowBlurChange} />
          </InspectorSectionRow>
          <InspectorSectionRow lead>
            <FieldInput type="number" value={visual.shadowOffsetY} onChange={handleShadowOffsetYChange} />
          </InspectorSectionRow>
          <InspectorSectionRow lead>
            <FieldInput type="number" value={visual.shadowOffsetX} onChange={handleShadowOffsetXChange} />
          </InspectorSectionRow>
        </InspectorSectionBody>
      </InspectorSection>

    </fieldset>
  );
}

function InspectorSection({ children }: { children: React.ReactNode }) {
  return (
    <div className='border-b border-border-secondary'>
      {children}
    </div>
  )
}

function InspectorSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className='h-10 px-2 flex items-center text-lg font-medium'>
      {children}
    </div>
  )
}

function InspectorSectionBody({ children, show = true }: { children: React.ReactNode, show?: boolean }) {
  if (!show) return null;

  return (
    <div className={'px-2 flex flex-col gap-2 pb-3'}>
      {children}
    </div>
  )
}

function InspectorSectionRow({ children, lead }: { children: React.ReactNode; lead?: boolean }) {
  return (
    <div className={cn('grid gap-2', lead ? 'grid-cols-[1fr_repeat(2,24px)]' : 'grid-cols-[repeat(2,1fr)_24px]')}>
      {children}
    </div>
  )
}


interface CheckboxProps {
  checked?: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}

function Checkbox({ checked, className, onChange }: CheckboxProps) {
  return (
    <label className={cn('flex items-center justify-center size-4 rounded border transition-colors cursor-pointer', checked ? 'bg-brand_primary border-brand' : 'bg-secondary border-primary', className)}>
      {checked ? <Check size={14} strokeWidth={3} /> : null}
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
