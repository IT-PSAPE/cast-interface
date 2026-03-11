import type { TextCaseTransform, TextElementPayload, TextHorizontalAlign, TextVerticalAlign } from '@core/types';
import { applyTextVisualPayload, readTextFormatting, readTextVisualPayload, type TextVisualState } from '@core/element-payload';
import { parseNumber } from '../../../utils/slides';
import { useElements } from '../../../contexts/element-context';
import { FieldColor, FieldInput, FieldSelect } from '../../../components/labeled-field';
import { useSystemFonts } from '../hooks/use-system-fonts';

import { SegmentedControl as Control } from '../../../components/segmented-controls';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon } from '../../../components/segmented-control';
import { CheckboxSection } from '../../../components/checkbox-section';
import { AlignTop01 } from '@renderer/components/icon/align-top-01';
import { AlignBottom01 } from '@renderer/components/icon/align-bottom-01';
import { AlignVerticalCenter01 } from '@renderer/components/icon/align-vertical-center-01';
import { AlignLeft } from '@renderer/components/icon/align-left';
import { AlignCenter } from '@renderer/components/icon/align-center';
import { AlignJustify } from '@renderer/components/icon/align-justify';
import { AlignRight } from '@renderer/components/icon/align-right';
import { Bold02 } from '@renderer/components/icon/bold-02';
import { Italic01 } from '@renderer/components/icon/italic-01';
import { Underline01 } from '@renderer/components/icon/underline-01';
import { Strikethrough01 } from '@renderer/components/icon/strikethrough-01';
import { Type01 } from '@renderer/components/icon/type-01';
import { LineHeight } from '@renderer/components/icon/line-height';

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
    return <div className="text-[12px] text-text-tertiary">Select an object to edit text properties.</div>;
  }

  if (selectedElement.type !== 'text') {
    return <div className="text-[12px] text-text-tertiary">Text controls are available only when a text object is selected.</div>;
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
  function handleStrokeToggle(enabled: boolean) { updateTextVisual({ strokeEnabled: enabled }); }
  function handleStrokeColorChange(value: string) { updateTextVisual({ strokeColor: value }); }
  function handleStrokeWidthChange(value: string) { updateTextVisual({ strokeWidth: Math.max(0, parseNumber(value, textVisual.strokeWidth)) }); }
  function handleShadowToggle(enabled: boolean) { updateTextVisual({ shadowEnabled: enabled }); }
  function handleShadowColorChange(value: string) { updateTextVisual({ shadowColor: value }); }
  function handleShadowBlurChange(value: string) { updateTextVisual({ shadowBlur: Math.max(0, parseNumber(value, textVisual.shadowBlur)) }); }
  function handleShadowOffsetXChange(value: string) { updateTextVisual({ shadowOffsetX: parseNumber(value, textVisual.shadowOffsetX) }); }
  function handleShadowOffsetYChange(value: string) { updateTextVisual({ shadowOffsetY: parseNumber(value, textVisual.shadowOffsetY) }); }
  function handleVerticalAlighmentChange(value: string) {
    updateText({ verticalAlign: value as TextVerticalAlign });
  }

  function handleHorizontalAlighmentChange(value: string) {
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
    <div className="grid gap-2">
      <fieldset className={`m-0 min-w-0 border-0 p-0 grid gap-2 ${textPayload.locked ? 'opacity-50' : ''}`} disabled={textPayload.locked}>
        <FieldInput value={textPayload.text} onChange={handleTextChange} />

        <div className="grid grid-cols-2 gap-2">
          <FieldSelect value={formatting.fontFamily} onChange={handleFontFamilyChange} options={fontOptions} />
          <FieldInput type="text" value={formatting.weight} onChange={handleWeightChange} />
          <FieldInput icon={<Type01 />} type="number" value={formatting.fontSize} onChange={handleFontSizeChange} />
          <FieldInput icon={<LineHeight />} type="number" value={formatting.lineHeight} onChange={handleLineHeightChange} />
        </div>

        <div className="grid gap-1 border-t border-border-secondary pt-1.5">
          <span className="text-[11px] uppercase tracking-wider text-text-tertiary">Formatting</span>
          <SegmentedControl label="Text formatting" selectionMode="multiple" value={activeFormattingStyles} onValueChange={handleTextStyleToggle} className="w-full [&>button]:flex-1">
            <SegmentedControlItem value="bold" title="Bold" variant="icon">
              <SegmentedControlItemIcon><Bold02 /></SegmentedControlItemIcon>
            </SegmentedControlItem>
            <SegmentedControlItem value="italic" title="Italic" variant="icon">
              <SegmentedControlItemIcon><Italic01 /></SegmentedControlItemIcon>
            </SegmentedControlItem>
            <SegmentedControlItem value="underline" title="Underline" variant="icon">
              <SegmentedControlItemIcon><Underline01 /></SegmentedControlItemIcon>
            </SegmentedControlItem>
            <SegmentedControlItem value="strikethrough" title="Strikethrough" variant="icon">
              <SegmentedControlItemIcon><Strikethrough01 /></SegmentedControlItemIcon>
            </SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FieldSelect value={formatting.caseTransform} onChange={handleCaseChange} options={CASE_OPTIONS} />
          <FieldColor value={textVisual.color} onChange={handleTextColorChange} />
        </div>

        <div className="flex gap-2 pt-1.5">
          <Control.Root fill className="w-full" value={formatting.alignment} onValueChange={handleHorizontalAlighmentChange} aria-label="Horizontal text alignment">
            <Control.Icon fill value="left" title="Align left" aria-label="Align left">
              <AlignLeft />
            </Control.Icon>
            <Control.Icon fill value="center" title="Align center" aria-label="Align center">
              <AlignCenter />
            </Control.Icon>
            <Control.Icon fill value="right" title="Align right" aria-label="Align right">
              <AlignRight />
            </Control.Icon>
            <Control.Icon fill value="justify" title="Justify text" aria-label="Justify text">
              <AlignJustify />
            </Control.Icon>
          </Control.Root>

          <Control.Root fill className="w-full" value={formatting.verticalAlign} onValueChange={handleVerticalAlighmentChange} aria-label="Vertical text alignment">
            <Control.Icon fill value="top" title="Align top" aria-label="Align top">
              <AlignTop01 />
            </Control.Icon>
            <Control.Icon fill value="middle" title="Align middle" aria-label="Align middle">
              <AlignVerticalCenter01 />
            </Control.Icon>
            <Control.Icon fill value="bottom" title="Align bottom" aria-label="Align bottom">
              <AlignBottom01 />
            </Control.Icon>
          </Control.Root>
        </div>

        <CheckboxSection label="Text Stroke" enabled={textVisual.strokeEnabled} onToggle={handleStrokeToggle}>
          <div className="grid grid-cols-2 gap-2">
            <FieldColor value={textVisual.strokeColor} onChange={handleStrokeColorChange} />
            <FieldInput type="number" value={textVisual.strokeWidth} onChange={handleStrokeWidthChange} />
          </div>
        </CheckboxSection>

        <CheckboxSection label="Text Shadow" enabled={textVisual.shadowEnabled} onToggle={handleShadowToggle}>
          <div className="grid grid-cols-2 gap-2">
            <FieldColor value={textVisual.shadowColor} onChange={handleShadowColorChange} />
            <FieldInput type="number" value={textVisual.shadowBlur} onChange={handleShadowBlurChange} />
            <FieldInput type="number" value={textVisual.shadowOffsetX} onChange={handleShadowOffsetXChange} />
            <FieldInput type="number" value={textVisual.shadowOffsetY} onChange={handleShadowOffsetYChange} />
          </div>
        </CheckboxSection>
      </fieldset>
    </div>
  );
}
