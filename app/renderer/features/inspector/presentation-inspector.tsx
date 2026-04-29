import { useEffect, useMemo, useState } from 'react';
import { Unlink } from 'lucide-react';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { ReacstButton } from '@renderer/components/controls/button';
import { FieldInput, FieldSelect } from '../../components/form/field';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { Section } from './inspector-section';
import { Label } from '@renderer/components/display/text';

const NO_TEMPLATE_VALUE = '';

export function DeckItemInspector() {
  const { currentDeckItem, renameDeckItem } = useNavigation();
  const { templates, templatesById } = useProjectContent();
  const { applyTemplateToTarget, detachTemplateFromDeckItem } = useTemplateEditor();
  const [titleDraft, setTitleDraft] = useState('');

  const assignedTemplate = currentDeckItem?.templateId
    ? templatesById.get(currentDeckItem.templateId) ?? null
    : null;

  const compatibleTemplates = useMemo(() => {
    if (!currentDeckItem) return [];
    return templates.filter((template) => isTemplateCompatibleWithDeckItem(template, currentDeckItem.type));
  }, [currentDeckItem, templates]);

  const templateOptions = useMemo(() => [
    { value: NO_TEMPLATE_VALUE, label: 'Select a template…' },
    ...compatibleTemplates.map((template) => ({ value: template.id, label: template.name })),
  ], [compatibleTemplates]);

  useEffect(() => {
    if (!currentDeckItem) {
      setTitleDraft('');
      return;
    }
    setTitleDraft(currentDeckItem.title);
  }, [currentDeckItem]);

  function handleTitleChange(value: string) {
    setTitleDraft(value);
  }

  function handleTitleBlur() {
    if (!currentDeckItem) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === currentDeckItem.title) return;
    void renameDeckItem(currentDeckItem.id, trimmed);
  }

  function handleResetToTemplate() {
    if (!currentDeckItem?.templateId) return;
    void applyTemplateToTarget(currentDeckItem.templateId, { type: 'deck-item', itemId: currentDeckItem.id });
  }

  function handleApplyTemplate(templateId: string) {
    if (!currentDeckItem || templateId === NO_TEMPLATE_VALUE) return;
    void applyTemplateToTarget(templateId, { type: 'deck-item', itemId: currentDeckItem.id });
  }

  function handleDetachTemplate() {
    if (!currentDeckItem) return;
    void detachTemplateFromDeckItem(currentDeckItem.id);
  }

  if (!currentDeckItem) {
    return <div className="text-sm text-tertiary">No item selected.</div>;
  }

  const itemLabel = currentDeckItem.type === 'lyric' ? 'Lyric' : 'Presentation';
  const hasTemplateId = Boolean(currentDeckItem.templateId);

  return (
    <>
      <Section.Root>
        <Section.Header>
          <Label.xs>{itemLabel}</Label.xs>
        </Section.Header>
        <Section.Body>
          <FieldInput type="text" value={titleDraft} onChange={handleTitleChange} onBlur={handleTitleBlur} />
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <Label.xs>Template</Label.xs>
        </Section.Header>
        <Section.Body>
          {assignedTemplate ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-tertiary uppercase tracking-wider">Assigned Template</span>
                <p className="m-0 text-sm text-secondary">{assignedTemplate.name}</p>
              </div>
              <div className="flex gap-2">
                <ReacstButton onClick={handleResetToTemplate} className="flex-1">Reset To Template</ReacstButton>
                <ReacstButton.Icon label="Remove template" onClick={handleDetachTemplate}>
                  <Unlink size={14} />
                </ReacstButton.Icon>
              </div>
            </>
          ) : hasTemplateId ? (
            <>
              <p className="m-0 text-sm text-tertiary">Assigned template unavailable.</p>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <FieldSelect value={NO_TEMPLATE_VALUE} onChange={handleApplyTemplate} options={templateOptions} />
                </div>
                <ReacstButton.Icon label="Remove template" onClick={handleDetachTemplate}>
                  <Unlink size={14} />
                </ReacstButton.Icon>
              </div>
            </>
          ) : compatibleTemplates.length === 0 ? (
            <p className="m-0 text-sm text-tertiary">No compatible templates available.</p>
          ) : (
            <FieldSelect value={NO_TEMPLATE_VALUE} onChange={handleApplyTemplate} options={templateOptions} />
          )}
        </Section.Body>
      </Section.Root>
    </>
  );
}
