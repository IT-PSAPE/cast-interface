import type { TextCaseTransform } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { ColorPicker } from '../../components/form/color-picker';
import { FieldIcon, FieldInput, FieldSelect } from '../../components/form/field';
import { useTextInspector } from './use-text-inspector';

import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart,
  Baseline, Bold, Italic,
  Strikethrough, Type, Underline,
} from 'lucide-react';
import { Section } from './inspector-section';
import { StrokeSectionFields, ShadowSectionFields } from './effect-section-fields';
import { SegmentedControl } from '@renderer/components/controls/segmented-control';

const CASE_OPTIONS: Array<{ value: TextCaseTransform; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'sentence', label: 'Sentence' },
];

export function TextElementInspector() {
  const result = useTextInspector();

  if (!result) {
    return <div className="text-sm text-tertiary">Select an object to edit text properties.</div>;
  }

  const { state, actions } = result;
  const { textPayload, formatting, textVisual, activeFormattingStyles, fontOptions } = state;
  const {
    handleTextChange, handleFontFamilyChange, handleWeightChange,
    handleFontSizeChange, handleLineHeightChange, handleTextColorChange,
    handleCaseChange, handleTextStyleToggle, handleVerticalAlighmentChange,
    handleHorizontalAlighmentChange, updateTextVisual,
  } = actions;

  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', textPayload.locked && 'opacity-50')} disabled={textPayload.locked}>
      <Section.Root>
        <Section.Header>
          <span>Content</span>
        </Section.Header>
        <Section.Body>
          <FieldInput value={textPayload.text} onChange={handleTextChange} />
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Typography</span>
        </Section.Header>
        <Section.Body>
          <Section.Row>
            <FieldSelect value={formatting.fontFamily} onChange={handleFontFamilyChange} options={fontOptions} />
            <FieldInput type="text" value={formatting.weight} onChange={handleWeightChange} />
          </Section.Row>
          <Section.Row>
            <FieldInput type="number" value={formatting.fontSize} onChange={handleFontSizeChange}>
              <FieldIcon><Type className="size-4" /></FieldIcon>
            </FieldInput>
            <FieldInput type="number" value={formatting.lineHeight} onChange={handleLineHeightChange}>
              <FieldIcon><Baseline className="size-4" /></FieldIcon>
            </FieldInput>
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Formatting</span>
        </Section.Header>
        <Section.Body>
          <SegmentedControl label="Text formatting" selectionMode="multiple" value={activeFormattingStyles} onValueChange={handleTextStyleToggle} className="w-full [&>button]:flex-1">
            <SegmentedControl.Icon value="bold" title="Bold" fill>
              <Bold className="size-4" />
            </SegmentedControl.Icon>
            <SegmentedControl.Icon value="italic" title="Italic" fill>
              <Italic className="size-4" />
            </SegmentedControl.Icon>
            <SegmentedControl.Icon value="underline" title="Underline" fill>
              <Underline className="size-4" />
            </SegmentedControl.Icon>
            <SegmentedControl.Icon value="strikethrough" title="Strikethrough" fill>
              <Strikethrough className="size-4" />
            </SegmentedControl.Icon>
          </SegmentedControl>
          <Section.Row>
            <FieldSelect value={formatting.caseTransform} onChange={handleCaseChange} options={CASE_OPTIONS} />
            <ColorPicker value={textVisual.color} onChange={handleTextColorChange} />
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Alignment</span>
        </Section.Header>
        <Section.Body>
          <div className="flex gap-2">
            <SegmentedControl fill className="w-full" value={formatting.alignment} onValueChange={handleHorizontalAlighmentChange} aria-label="Horizontal text alignment">
              <SegmentedControl.Icon fill value="left" title="Align left" aria-label="Align left">
                <AlignLeft className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="center" title="Align center" aria-label="Align center">
                <AlignCenter className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="right" title="Align right" aria-label="Align right">
                <AlignRight className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="justify" title="Justify text" aria-label="Justify text">
                <AlignJustify className="size-4" />
              </SegmentedControl.Icon>
            </SegmentedControl>

            <SegmentedControl fill className="w-full" value={formatting.verticalAlign} onValueChange={handleVerticalAlighmentChange} aria-label="Vertical text alignment">
              <SegmentedControl.Icon fill value="top" title="Align top" aria-label="Align top">
                <AlignVerticalJustifyStart className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="middle" title="Align middle" aria-label="Align middle">
                <AlignVerticalJustifyCenter className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="bottom" title="Align bottom" aria-label="Align bottom">
                <AlignVerticalJustifyEnd className="size-4" />
              </SegmentedControl.Icon>
            </SegmentedControl>
          </div>
        </Section.Body>
      </Section.Root>

      <StrokeSectionFields
        label="Text Stroke"
        enabled={textVisual.strokeEnabled}
        color={textVisual.strokeColor}
        width={textVisual.strokeWidth}
        position={textVisual.strokePosition}
        onToggle={(enabled) => updateTextVisual({ strokeEnabled: enabled })}
        onUpdate={updateTextVisual}
      />

      <ShadowSectionFields
        label="Text Shadow"
        enabled={textVisual.shadowEnabled}
        color={textVisual.shadowColor}
        blur={textVisual.shadowBlur}
        offsetX={textVisual.shadowOffsetX}
        offsetY={textVisual.shadowOffsetY}
        onToggle={(enabled) => updateTextVisual({ shadowEnabled: enabled })}
        onUpdate={updateTextVisual}
      />
    </fieldset>
  );
}
