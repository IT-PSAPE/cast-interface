import { useEffect, useState } from 'react';
import { Button } from '../../../components/button';
import { FieldInput } from '../../../components/labeled-field';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { Section } from './inspector-section';

export function PresentationInspector() {
  const {
    currentPresentation,
    renamePresentation
  } = useNavigation();
  const { templatesById } = useProjectContent();
  const { resetPresentationToAssignedTemplate } = useTemplateEditor();
  const [titleDraft, setTitleDraft] = useState('');

  const assignedTemplate = currentPresentation?.templateId
    ? templatesById.get(currentPresentation.templateId) ?? null
    : null;

  useEffect(() => {
    if (!currentPresentation) {
      setTitleDraft('');
      return;
    }
    setTitleDraft(currentPresentation.title);
  }, [currentPresentation]);

  function handleTitleChange(value: string) {
    setTitleDraft(value);
  }

  function handleTitleBlur() {
    if (!currentPresentation) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === currentPresentation.title) return;
    void renamePresentation(currentPresentation.id, trimmed);
  }

  function handleResetToTemplate() {
    if (!currentPresentation?.templateId) return;
    void resetPresentationToAssignedTemplate(currentPresentation.id);
  }

  if (!currentPresentation) {
    return <div className="text-sm text-text-tertiary">No presentation selected.</div>;
  }

  return (
    <>
      <Section.Root>
        <Section.Header>
          <span>Presentation</span>
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
            <span className="text-sm text-text-tertiary uppercase tracking-wider">Created</span>
            <p className="m-0 text-sm text-text-secondary">
              {new Date(currentPresentation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Section.Body>
      </Section.Root>

      <Section.Root>
        <Section.Header>
          <span>Template</span>
        </Section.Header>
        <Section.Body>
          {currentPresentation.templateId ? (
            <>
              <div className="grid gap-1">
                <span className="text-sm text-text-tertiary uppercase tracking-wider">Assigned Template</span>
                <p className="m-0 text-sm text-text-secondary">
                  {assignedTemplate?.name ?? 'Assigned template unavailable'}
                </p>
              </div>
              <Button onClick={handleResetToTemplate} disabled={!assignedTemplate} className="w-full">
                Reset To Template
              </Button>
            </>
          ) : (
            <p className="m-0 text-sm text-text-tertiary">
              No template assigned. Apply a template from the templates drawer to reuse it for new slides and resets.
            </p>
          )}
        </Section.Body>
      </Section.Root>
    </>
  );
}
