import type { TextCaseTransform, TextElementPayload, TextHorizontalAlign, TextVerticalAlign } from '@core/types';
import { applyTextVisualPayload, readTextFormatting, readTextVisualPayload, type TextVisualState } from '@core/element-payload';
import { cn } from '@renderer/utils/cn';
import { parseNumber } from '../../../utils/slides';
import { useElements } from '../../../contexts/element/element-context';
import { ColorPicker } from '../../../components/form/color-picker';
import { FieldInput } from '../../../components/form/field-input';
import { FieldSelect } from '../../../components/form/field-select';
import { useSystemFonts } from '../hooks/use-system-fonts';

import { SegmentedControl } from '../../../components/controls/segmented-controls';
import {
  AlignCenter, AlignCenterVertical, AlignEndVertical, AlignJustify,
  AlignLeft, AlignRight, AlignStartVertical,
  Baseline, Bold, Italic,
  Strikethrough, Type, Underline,
} from 'lucide-react';
import { Section } from './inspector-section';
import { StrokeSectionFields } from './stroke-section-fields';
import { ShadowSectionFields } from './shadow-section-fields';

const CASE_OPTIONS: Array<{ value: TextCaseTransform; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'sentence', label: 'Sentence' },
];

export function TextElementInspector() {
  const { selectedElement, elementPayloadDraft, setElementPayloadDraft } = useElements();
  const activeFont = selectedElement?.type === 'text' && elementPayloadDraft ? (elementPayloadDraft as TextElementPayload).fontFamily : '';
  const fontOptions = useSystemFonts(activeFont);

  if (!selectedElement || !elementPayloadDraft) {
    return <div className="text-sm text-text-tertiary">Select an object to edit text properties.</div>;
  }

  if (selectedElement.type !== 'text') {
    return <div className="text-sm text-text-tertiary">Text controls are available only when a text object is selected.</div>;
  }

  const textPayload = elementPayloadDraft as TextElementPayload;
  const formatting = readTextFormatting(textPayload);
  const textVisual = readTextVisualPayload(textPayload);
  const isBold = Number.parseInt(formatting.weight, 10) >= 600;

  function updateText(patch: Partial<TextElementPayload>) { setElementPayloadDraft({ ...textPayload, ...patch }); }
  function updateTextVisual(patch: Partial<TextVisualState>) {
    const nextVisual = { ...readTextVisualPayload(textPayload), ...patch };
    setElementPayloadDraft(applyTextVisualPayload(textPayload, nextVisual));
  }

  function handleTextChange(value: string) { updateText({ text: value }); }
  function handleFontFamilyChange(value: string) { updateText({ fontFamily: value }); }
  function handleWeightChange(value: string) { updateText({ weight: value }); }
  function handleFontSizeChange(value: string) { updateText({ fontSize: Math.max(1, parseNumber(value, formatting.fontSize)) }); }
  function handleLineHeightChange(value: string) { updateText({ lineHeight: Math.max(0.6, parseNumber(value, formatting.lineHeight)) }); }
  function handleTextColorChange(value: string) { updateTextVisual({ color: value }); }
  function handleCaseChange(value: string) { updateText({ caseTransform: value as TextCaseTransform }); }
  function handleBoldToggle() { updateText({ weight: isBold ? '400' : '700' }); }
  function handleItalicToggle() { updateText({ italic: !formatting.italic }); }
  function handleUnderlineToggle() { updateText({ underline: !formatting.underline }); }
  function handleStrikeToggle() { updateText({ strikethrough: !formatting.strikethrough }); }
  function handleVerticalAlighmentChange(value: string | string[]) {
    if (Array.isArray(value)) return;
    updateText({ verticalAlign: value as TextVerticalAlign });
  }

  function handleHorizontalAlighmentChange(value: string | string[]) {
    if (Array.isArray(value)) return;
    updateText({ alignment: value as TextHorizontalAlign });
  }

  const activeFormattingStyles: string[] = [];
  if (isBold) activeFormattingStyles.push('bold');
  if (formatting.italic) activeFormattingStyles.push('italic');
  if (formatting.underline) activeFormattingStyles.push('underline');
  if (formatting.strikethrough) activeFormattingStyles.push('strikethrough');

  function handleTextStyleToggle(value: string | string[]) {
    const next = Array.isArray(value) ? value : [value];
    const wasBold = isBold;
    const nowBold = next.includes('bold');
    if (wasBold !== nowBold) handleBoldToggle();

    const wasItalic = formatting.italic;
    const nowItalic = next.includes('italic');
    if (wasItalic !== nowItalic) handleItalicToggle();

    const wasUnderline = formatting.underline;
    const nowUnderline = next.includes('underline');
    if (wasUnderline !== nowUnderline) handleUnderlineToggle();

    const wasStrike = formatting.strikethrough;
    const nowStrike = next.includes('strikethrough');
    if (wasStrike !== nowStrike) handleStrikeToggle();
  }

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
            <FieldInput icon={<Type className="size-4" />} type="number" value={formatting.fontSize} onChange={handleFontSizeChange} />
            <FieldInput icon={<Baseline className="size-4" />} type="number" value={formatting.lineHeight} onChange={handleLineHeightChange} />
          </Section.Row>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Formatting</span>
        </Section.Header>
        <Section.Body>
          <SegmentedControl.Root label="Text formatting" selectionMode="multiple" value={activeFormattingStyles} onValueChange={handleTextStyleToggle} className="w-full [&>button]:flex-1">
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
          </SegmentedControl.Root>
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
            <SegmentedControl.Root fill className="w-full" value={formatting.alignment} onValueChange={handleHorizontalAlighmentChange} aria-label="Horizontal text alignment">
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
            </SegmentedControl.Root>

            <SegmentedControl.Root fill className="w-full" value={formatting.verticalAlign} onValueChange={handleVerticalAlighmentChange} aria-label="Vertical text alignment">
              <SegmentedControl.Icon fill value="top" title="Align top" aria-label="Align top">
                <AlignStartVertical className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="middle" title="Align middle" aria-label="Align middle">
                <AlignCenterVertical className="size-4" />
              </SegmentedControl.Icon>
              <SegmentedControl.Icon fill value="bottom" title="Align bottom" aria-label="Align bottom">
                <AlignEndVertical className="size-4" />
              </SegmentedControl.Icon>
            </SegmentedControl.Root>
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
