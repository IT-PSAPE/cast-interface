import { useEffect, useState } from 'react';
import { Button } from '../../components/controls/button';
import { FieldInput } from '../../components/form/field';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { Section } from './inspector-section';

export function DeckItemInspector() {
  const {
    currentDeckItem,
    renameDeckItem,
  } = useNavigation();
  const { templatesById } = useProjectContent();
  const { resetDeckItemToAssignedTemplate } = useTemplateEditor();
  const [titleDraft, setTitleDraft] = useState('');

  const assignedTemplate = currentDeckItem?.templateId
    ? templatesById.get(currentDeckItem.templateId) ?? null
    : null;

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
    void resetDeckItemToAssignedTemplate(currentDeckItem.id);
  }

  if (!currentDeckItem) {
    return <div className="text-sm text-tertiary">No item selected.</div>;
  }

  const itemLabel = currentDeckItem.type === 'lyric' ? 'Lyric' : 'Presentation';

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
          <div className="flex flex-col gap-1">
            <span className="text-sm text-tertiary uppercase tracking-wider">Created</span>
            <p className="m-0 text-sm text-secondary">
              {new Date(currentDeckItem.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Template</span>
        </Section.Header>
        <Section.Body>
          {currentDeckItem.templateId ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-tertiary uppercase tracking-wider">Assigned Template</span>
                <p className="m-0 text-sm text-secondary">
                  {assignedTemplate?.name ?? 'Assigned template unavailable'}
                </p>
              </div>
              <Button onClick={handleResetToTemplate} disabled={!assignedTemplate} className="w-full">
                Reset To Template
              </Button>
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
