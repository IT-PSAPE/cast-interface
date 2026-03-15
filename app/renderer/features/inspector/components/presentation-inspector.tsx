import { useEffect, useState } from 'react';
import { FieldInput } from '../../../components/labeled-field';
import { useNavigation } from '../../../contexts/navigation-context';
import { Section } from './inspector-section';

export function PresentationInspector() {
  const {
    currentPresentation,
    renamePresentation
  } = useNavigation();
  const [titleDraft, setTitleDraft] = useState('');

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
    </>
  );
}
