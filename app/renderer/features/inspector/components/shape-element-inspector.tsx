import { applyVisualPayload, readVisualPayload, supportsVisualStyling, type VisualPayloadState } from '@core/element-payload';
import { parseNumber } from '../../../utils/slides';
import { useElements } from '../../../contexts/element-context';
import { Button } from '../../../components/button';
import { CheckboxField } from '../../../components/checkbox-field';
import { LabeledField, FieldInput } from '../../../components/labeled-field';
import { CheckboxSection } from '../../../components/checkbox-section';
import type { ElementInspectorDraft } from '../../../types/ui';

export function ShapeElementInspector() {
  const {
    selectedElement,
    elementDraft,
    elementPayloadDraft,
    lockAspectRatio,
    setElementDraft,
    setElementPayloadDraft,
    setLockAspectRatio,
    deleteSelected,
  } = useElements();

  if (!selectedElement || !elementDraft || !elementPayloadDraft) {
    return <div className="text-[12px] text-text-muted">Select an object to edit shape properties.</div>;
  }

  const activeElement = selectedElement;
  const activePayload = elementPayloadDraft;
  const visual = readVisualPayload(activeElement.type, activePayload);
  const canStyle = supportsVisualStyling(activeElement.type);

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
  function handleFlipX() { updateVisual({ flipX: !visual.flipX }); }
  function handleFlipY() { updateVisual({ flipY: !visual.flipY }); }
  function handleVisibilityToggle(enabled: boolean) { updateVisual({ visible: enabled }); }
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
  function handleDelete() { void deleteSelected(); }

  return (
    <div className="grid gap-2">
      <fieldset className={`m-0 min-w-0 border-0 p-0 grid gap-2 ${visual.locked ? 'opacity-50' : ''}`} disabled={visual.locked}>
        <div className="grid grid-cols-2 gap-2">
          <LabeledField label="X"><FieldInput type="number" value={Math.round(elementDraft.x)} onChange={handleXChange} /></LabeledField>
          <LabeledField label="Y"><FieldInput type="number" value={Math.round(elementDraft.y)} onChange={handleYChange} /></LabeledField>
          <LabeledField label="Width"><FieldInput type="number" value={Math.round(elementDraft.width)} onChange={handleWChange} /></LabeledField>
          <LabeledField label="Height"><FieldInput type="number" value={Math.round(elementDraft.height)} onChange={handleHChange} /></LabeledField>
          <LabeledField label="Rotation"><FieldInput type="number" value={Math.round(elementDraft.rotation)} onChange={handleRotationChange} /></LabeledField>
          <LabeledField label="Opacity"><FieldInput type="number" value={Math.round(elementDraft.opacity * 100)} onChange={handleOpacityChange} min={0} max={100} step={1} /></LabeledField>
        </div>

        <div className="flex items-center gap-2 border-t border-stroke-light pt-1.5">
          <CheckboxField checked={lockAspectRatio} onChange={setLockAspectRatio} label="Lock ratio" />
          <Button onClick={handleFlipX} className={visual.flipX ? 'border-focus text-text-primary' : ''}>Flip H</Button>
          <Button onClick={handleFlipY} className={visual.flipY ? 'border-focus text-text-primary' : ''}>Flip V</Button>
        </div>

        <CheckboxSection label="Visibility" enabled={visual.visible} onToggle={handleVisibilityToggle} />

        {canStyle ? (
          <>
            <CheckboxSection label="Fill" enabled={visual.fillEnabled} onToggle={handleFillToggle}>
              <LabeledField label="Color" wide>
                <FieldInput type="text" value={visual.fillColor} onChange={handleFillColorChange} />
              </LabeledField>
            </CheckboxSection>

            <CheckboxSection label="Stroke" enabled={visual.strokeEnabled} onToggle={handleStrokeToggle}>
              <div className="grid grid-cols-2 gap-2">
                <LabeledField label="Color"><FieldInput type="text" value={visual.strokeColor} onChange={handleStrokeColorChange} /></LabeledField>
                <LabeledField label="Width"><FieldInput type="number" value={visual.strokeWidth} onChange={handleStrokeWidthChange} /></LabeledField>
              </div>
            </CheckboxSection>

            <CheckboxSection label="Shadow" enabled={visual.shadowEnabled} onToggle={handleShadowToggle}>
              <div className="grid grid-cols-2 gap-2">
                <LabeledField label="Color"><FieldInput type="text" value={visual.shadowColor} onChange={handleShadowColorChange} /></LabeledField>
                <LabeledField label="Blur"><FieldInput type="number" value={visual.shadowBlur} onChange={handleShadowBlurChange} /></LabeledField>
                <LabeledField label="Offset X"><FieldInput type="number" value={visual.shadowOffsetX} onChange={handleShadowOffsetXChange} /></LabeledField>
                <LabeledField label="Offset Y"><FieldInput type="number" value={visual.shadowOffsetY} onChange={handleShadowOffsetYChange} /></LabeledField>
              </div>
            </CheckboxSection>
          </>
        ) : (
          <div className="border-t border-stroke-light pt-1.5 text-[12px] text-text-muted">Fill, stroke, and shadow are available for shape and text objects.</div>
        )}
      </fieldset>

      <div className="mt-2 border-t border-stroke-light pt-2">
        <Button variant="danger" onClick={handleDelete} disabled={visual.locked}>Delete</Button>
      </div>
    </div>
  );
}
