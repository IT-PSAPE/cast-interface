import { useEffect, useRef, useState } from 'react';
import { FieldInput } from '../../components/form/field';
import { useCast } from '../../contexts/app-context';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { Section } from './inspector-section';

export function TemplateInspector() {
  const { setStatusText } = useCast();
  const { currentTemplate, renameTemplate, nameFocusRequest } = useTemplateEditor();
  const [nameDraft, setNameDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentTemplate) {
      setNameDraft('');
      return;
    }
    setNameDraft(currentTemplate.name);
  }, [currentTemplate]);

  useEffect(() => {
    if (!nameFocusRequest || !nameInputRef.current) return;
    nameInputRef.current.focus();
    nameInputRef.current.select();
  }, [nameFocusRequest]);

  function handleNameChange(value: string) {
    setNameDraft(value);
  }

  function handleNameBlur() {
    if (!currentTemplate) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === currentTemplate.name) return;
    renameTemplate(currentTemplate.id, trimmed);
    setStatusText('Template renamed');
  }

  if (!currentTemplate) {
    return <div className="text-sm text-tertiary">No template selected.</div>;
  }

  return (
    <Section.Root>
      <Section.Header>
        <span>Template</span>
      </Section.Header>
      <Section.Body>
        <FieldInput
          type="text"
          value={nameDraft}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          label="Name"
          wide
          inputRef={nameInputRef}
        />
      </Section.Body>
    </Section.Root>
  );
}
