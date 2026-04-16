import { cn } from '@renderer/utils/cn';
import { ColorPicker } from '../../components/form/color-picker';
import { FieldIcon, FieldInput } from '../../components/form/field';
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal,
  AlignEndVertical, AlignStartHorizontal, AlignStartVertical,
  CornerUpRight, Eye, FlipHorizontal2, MoveHorizontal, MoveVertical,
  RotateCcw, Square,
} from 'lucide-react';
import { IconGroup } from '@renderer/components/icon-group';
import { useShapeInspector } from './use-shape-inspector';
import { Section } from './inspector-section';
import { StrokeSectionFields, ShadowSectionFields } from './effect-section-fields';
import { EmptyState } from '../../components/display/empty-state';

export function ShapeElementInspector() {
  const result = useShapeInspector();

  if (!result) {
    return <EmptyState.Root><EmptyState.Title>Select an object to edit shape properties.</EmptyState.Title></EmptyState.Root>;
  }

  const { state, actions } = result;
  const { elementDraft, visual, styleLabelPrefix, locked } = state;
  const {
    handleXChange, handleYChange, handleWChange, handleHChange,
    handleRotationChange, handleOpacityChange,
    handleAlignLeft, handleAlignCenter, handleAlignRight,
    handleAlignTop, handleAlignMiddle, handleAlignBottom,
    handleFlipX, handleFlipY, handleFillToggle, handleFillColorChange,
    updateVisual,
  } = actions;

  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', locked && 'opacity-50')} disabled={locked}>
      <Section.Root>
        <Section.Header>
          <span>Position</span>
        </Section.Header>
        <Section.Body>
          <Section.Row>
            <IconGroup.Root fill>
              <IconGroup.Item onClick={handleAlignLeft} title="Align left" aria-label="Align left">
                <AlignStartHorizontal className="size-4" />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignCenter} title="Align center" aria-label="Align center">
                <AlignCenterHorizontal className="size-4" />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignRight} title="Align right" aria-label="Align right">
                <AlignEndHorizontal className="size-4" />
              </IconGroup.Item>
            </IconGroup.Root>
            <IconGroup.Root fill>
              <IconGroup.Item onClick={handleAlignTop} title="Align top" aria-label="Align top">
                <AlignStartVertical className="size-4" />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignMiddle} title="Align middle" aria-label="Align middle">
                <AlignCenterVertical className="size-4" />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleAlignBottom} title="Align bottom" aria-label="Align bottom">
                <AlignEndVertical className="size-4" />
              </IconGroup.Item>
            </IconGroup.Root>
          </Section.Row>
          <Section.Row>
            <FieldInput type="number" value={Math.round(elementDraft.x)} onChange={handleXChange}>
              <FieldIcon><MoveHorizontal size={14} /></FieldIcon>
            </FieldInput>
            <FieldInput type="number" value={Math.round(elementDraft.y)} onChange={handleYChange}>
              <FieldIcon><MoveVertical size={14} /></FieldIcon>
            </FieldInput>
          </Section.Row>
          <Section.Row>
            <FieldInput type="number" value={Math.round(elementDraft.rotation)} onChange={handleRotationChange}>
              <FieldIcon><RotateCcw size={14} /></FieldIcon>
            </FieldInput>
            <IconGroup.Root fill>
              <IconGroup.Item>
                <CornerUpRight className="size-4" />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleFlipX}>
                <FlipHorizontal2 className="size-4" />
              </IconGroup.Item>
              <IconGroup.Item onClick={handleFlipY}>
                <FlipHorizontal2 className="size-4 rotate-90" />
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
            <FieldInput type="number" value={Math.round(elementDraft.width)} onChange={handleWChange}>
              <FieldIcon><MoveHorizontal size={14} /></FieldIcon>
            </FieldInput>
            <FieldInput type="number" value={Math.round(elementDraft.height)} onChange={handleHChange}>
              <FieldIcon><MoveVertical size={14} /></FieldIcon>
            </FieldInput>
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Appearance</span>
        </Section.Header>
        <Section.Body>
          <Section.Row>
            <FieldInput type="number" value={Math.round(elementDraft.opacity * 100)} onChange={handleOpacityChange} min={0} max={100} step={1}>
              <FieldIcon><Eye size={14} /></FieldIcon>
            </FieldInput>
            <FieldInput type="number" value={0} onChange={() => { }} min={0} max={100} step={1}>
              <FieldIcon><Square size={14} /></FieldIcon>
            </FieldInput>
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

      <StrokeSectionFields
        label={`${styleLabelPrefix}Stroke`}
        enabled={visual.strokeEnabled}
        color={visual.strokeColor}
        width={visual.strokeWidth}
        position={visual.strokePosition}
        onToggle={(enabled) => updateVisual({ strokeEnabled: enabled })}
        onUpdate={updateVisual}
      />

      <ShadowSectionFields
        label={`${styleLabelPrefix}Shadow`}
        enabled={visual.shadowEnabled}
        color={visual.shadowColor}
        blur={visual.shadowBlur}
        offsetX={visual.shadowOffsetX}
        offsetY={visual.shadowOffsetY}
        onToggle={(enabled) => updateVisual({ shadowEnabled: enabled })}
        onUpdate={updateVisual}
      />

    </fieldset>
  );
}
