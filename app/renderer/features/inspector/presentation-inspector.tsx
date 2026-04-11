import { useEffect, useState } from 'react';
import { Button } from '../../components/controls/button';
import { FieldInput } from '../../components/form/field-input';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { Section } from './inspector-section';

export function ContentItemInspector() {
  const {
    currentContentItem,
    renameContentItem,
  } = useNavigation();
  const { templatesById } = useProjectContent();
  const { resetContentItemToAssignedTemplate } = useTemplateEditor();
  const [titleDraft, setTitleDraft] = useState('');

  const assignedTemplate = currentContentItem?.templateId
    ? templatesById.get(currentContentItem.templateId) ?? null
    : null;

  useEffect(() => {
    if (!currentContentItem) {
      setTitleDraft('');
      return;
    }
    setTitleDraft(currentContentItem.title);
  }, [currentContentItem]);

  function handleTitleChange(value: string) {
    setTitleDraft(value);
  }

  function handleTitleBlur() {
    if (!currentContentItem) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === currentContentItem.title) return;
    void renameContentItem(currentContentItem.id, trimmed);
  }

  function handleResetToTemplate() {
    if (!currentContentItem?.templateId) return;
    void resetContentItemToAssignedTemplate(currentContentItem.id);
  }

  if (!currentContentItem) {
    return <div className="text-sm text-tertiary">No item selected.</div>;
  }

  const itemLabel = currentContentItem.type === 'lyric' ? 'Lyric' : 'Deck';

  return (
    <>
      <Section.Root>
        <Section.Header>
          <span>{itemLabel}</span>
        </Section.Header>
        <Section.Body>
          <FieldInput type="text" value={titleDraft} onChange={handleTitleChange} onBlur={handleTitleBlur} />
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Details</span>
        </Section.Header>
        <Section.Body>
          <div className="grid gap-1">
            <span className="text-sm text-tertiary uppercase tracking-wider">Created</span>
            <p className="m-0 text-sm text-secondary">
              {new Date(currentContentItem.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Template</span>
        </Section.Header>
        <Section.Body>
          {currentContentItem.templateId ? (
            <>
              <div className="grid gap-1">
                <span className="text-sm text-tertiary uppercase tracking-wider">Assigned Template</span>
                <p className="m-0 text-sm text-secondary">
                  {assignedTemplate?.name ?? 'Assigned template unavailable'}
                </p>
              </div>
              <Button.Root onClick={handleResetToTemplate} disabled={!assignedTemplate} className="w-full">
                Reset To Template
              </Button.Root>
            </>
          ) : (
            <p className="m-0 text-sm text-tertiary">
              No template assigned. Apply a template from the templates drawer to reuse it for new slides and resets.
            </p>
          )}
        </Section.Body>
      </Section.Root>
    </>
  );
}
