import type { TextCaseTransform, TextElementPayload, TextHorizontalAlign, TextVerticalAlign } from '@core/types';
import { applyVisualPayload, readTextFormatting, readVisualPayload, type VisualPayloadState } from '@core/element-payload';
import { parseNumber } from '../../../utils/slides';
import { useElements } from '../../../contexts/element-context';
import { Button } from '../../../components/button';
import { FieldInput, FieldSelect, FieldTextarea, LabeledField } from '../../../components/labeled-field';
import { SegmentedControl, SegmentedControlItem } from '../../../components/segmented-control';
import { CheckboxSection } from '../../../components/checkbox-section';
import { useSystemFonts } from '../hooks/use-system-fonts';

const CASE_OPTIONS: Array<{ value: TextCaseTransform; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'sentence', label: 'Sentence' },
];

export function TextElementInspector() {
  const { selectedElement, elementPayloadDraft, setElementPayloadDraft, deleteSelected } = useElements();
  const activeFont = selectedElement?.type === 'text' && elementPayloadDraft ? (elementPayloadDraft as TextElementPayload).fontFamily : '';
  const fontOptions = useSystemFonts(activeFont);

  if (!selectedElement || !elementPayloadDraft) {
    return <div className="text-[12px] text-text-muted">Select an object to edit text properties.</div>;
  }

  if (selectedElement.type !== 'text') {
    return <div className="text-[12px] text-text-muted">Text controls are available only when a text object is selected.</div>;
  }

  const textPayload = elementPayloadDraft as TextElementPayload;
  const formatting = readTextFormatting(textPayload);
  const visual = readVisualPayload('text', textPayload);
  const isBold = Number.parseInt(formatting.weight, 10) >= 600;

  function updateText(patch: Partial<TextElementPayload>) { setElementPayloadDraft({ ...textPayload, ...patch }); }
  function updateVisual(patch: Partial<VisualPayloadState>) {
    const nextVisual = { ...readVisualPayload('text', textPayload), ...patch };
    setElementPayloadDraft(applyVisualPayload('text', textPayload, nextVisual));
  }

  function handleTextChange(value: string) { updateText({ text: value }); }
  function handleFontFamilyChange(value: string) { updateText({ fontFamily: value }); }
  function handleWeightChange(value: string) { updateText({ weight: value }); }
  function handleFontSizeChange(value: string) { updateText({ fontSize: Math.max(1, parseNumber(value, formatting.fontSize)) }); }
  function handleLineHeightChange(value: string) { updateText({ lineHeight: Math.max(0.6, parseNumber(value, formatting.lineHeight)) }); }
  function handleTextColorChange(value: string) { updateVisual({ fillColor: value }); }
  function handleCaseChange(value: string) { updateText({ caseTransform: value as TextCaseTransform }); }
  function handleAlignLeft() { updateText({ alignment: 'left' }); }
  function handleAlignCenter() { updateText({ alignment: 'center' }); }
  function handleAlignRight() { updateText({ alignment: 'right' }); }
  function handleAlignJustify() { updateText({ alignment: 'justify' }); }
  function handleVerticalTop() { updateText({ verticalAlign: 'top' }); }
  function handleVerticalMiddle() { updateText({ verticalAlign: 'middle' }); }
  function handleVerticalBottom() { updateText({ verticalAlign: 'bottom' }); }
  function handleBoldToggle() { updateText({ weight: isBold ? '400' : '700' }); }
  function handleItalicToggle() { updateText({ italic: !formatting.italic }); }
  function handleUnderlineToggle() { updateText({ underline: !formatting.underline }); }
  function handleStrikeToggle() { updateText({ strikethrough: !formatting.strikethrough }); }
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
        <LabeledField label="Text" wide><FieldTextarea value={textPayload.text} onChange={handleTextChange} /></LabeledField>

        <div className="grid grid-cols-2 gap-2">
          <LabeledField label="Font Family"><FieldSelect value={formatting.fontFamily} onChange={handleFontFamilyChange} options={fontOptions} /></LabeledField>
          <LabeledField label="Weight"><FieldInput type="text" value={formatting.weight} onChange={handleWeightChange} /></LabeledField>
          <LabeledField label="Size"><FieldInput type="number" value={formatting.fontSize} onChange={handleFontSizeChange} /></LabeledField>
          <LabeledField label="Line Height"><FieldInput type="number" value={formatting.lineHeight} onChange={handleLineHeightChange} /></LabeledField>
        </div>

        <div className="grid gap-1 border-t border-stroke-light pt-1.5">
          <span className="text-[11px] uppercase tracking-wider text-text-muted">Formatting</span>
          <SegmentedControl label="Text formatting">
            <SegmentedControlItem active={isBold} onClick={handleBoldToggle} title="Bold"><BoldIcon /></SegmentedControlItem>
            <SegmentedControlItem active={formatting.italic} onClick={handleItalicToggle} title="Italic"><ItalicIcon /></SegmentedControlItem>
            <SegmentedControlItem active={formatting.underline} onClick={handleUnderlineToggle} title="Underline"><UnderlineIcon /></SegmentedControlItem>
            <SegmentedControlItem active={formatting.strikethrough} onClick={handleStrikeToggle} title="Strikethrough"><StrikeIcon /></SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <LabeledField label="Capitalization"><FieldSelect value={formatting.caseTransform} onChange={handleCaseChange} options={CASE_OPTIONS} /></LabeledField>
          <LabeledField label="Text Color"><FieldInput type="text" value={visual.fillColor} onChange={handleTextColorChange} /></LabeledField>
        </div>

        <div className="grid gap-1 border-t border-stroke-light pt-1.5">
          <span className="text-[11px] uppercase tracking-wider text-text-muted">Horizontal Align</span>
          <SegmentedControl label="Horizontal alignment">
            <SegmentedControlItem active={isActiveHorizontal(formatting.alignment, 'left')} onClick={handleAlignLeft} title="Align left"><AlignLeftIcon /></SegmentedControlItem>
            <SegmentedControlItem active={isActiveHorizontal(formatting.alignment, 'center')} onClick={handleAlignCenter} title="Align center"><AlignCenterIcon /></SegmentedControlItem>
            <SegmentedControlItem active={isActiveHorizontal(formatting.alignment, 'right')} onClick={handleAlignRight} title="Align right"><AlignRightIcon /></SegmentedControlItem>
            <SegmentedControlItem active={isActiveHorizontal(formatting.alignment, 'justify')} onClick={handleAlignJustify} title="Justify"><AlignJustifyIcon /></SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="grid gap-1">
          <span className="text-[11px] uppercase tracking-wider text-text-muted">Vertical Align</span>
          <SegmentedControl label="Vertical alignment">
            <SegmentedControlItem active={formatting.verticalAlign === 'top'} onClick={handleVerticalTop} title="Align top"><AlignTopIcon /></SegmentedControlItem>
            <SegmentedControlItem active={formatting.verticalAlign === 'middle'} onClick={handleVerticalMiddle} title="Align middle"><AlignMiddleIcon /></SegmentedControlItem>
            <SegmentedControlItem active={formatting.verticalAlign === 'bottom'} onClick={handleVerticalBottom} title="Align bottom"><AlignBottomIcon /></SegmentedControlItem>
          </SegmentedControl>
        </div>

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
      </fieldset>

      <div className="mt-2 border-t border-stroke-light pt-2">
        <Button variant="danger" onClick={handleDelete} disabled={visual.locked}>Delete</Button>
      </div>
    </div>
  );
}

function isActiveHorizontal(current: TextHorizontalAlign, target: TextHorizontalAlign): boolean { return current === target; }
function BoldIcon() { return <span className="text-[12px] font-black">B</span>; }
function ItalicIcon() { return <span className="text-[12px] italic">I</span>; }
function UnderlineIcon() { return <span className="text-[12px] underline">U</span>; }
function StrikeIcon() { return <span className="text-[12px] line-through">S</span>; }
function AlignLeftIcon() { return <span className="text-[12px]">≡</span>; }
function AlignCenterIcon() { return <span className="text-[12px]">≣</span>; }
function AlignRightIcon() { return <span className="text-[12px]">☰</span>; }
function AlignJustifyIcon() { return <span className="text-[12px]">☷</span>; }
function AlignTopIcon() { return <span className="text-[12px]">↥</span>; }
function AlignMiddleIcon() { return <span className="text-[12px]">↕</span>; }
function AlignBottomIcon() { return <span className="text-[12px]">↧</span>; }
