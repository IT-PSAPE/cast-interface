import { useEffect, useState } from 'react';
import { FieldInput } from '../../../components/labeled-field';
import { useNavigation } from '../../../contexts/navigation-context';

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
    return <div className="text-[12px] text-text-tertiary">No presentation selected.</div>;
  }

  return (
    <div className="grid gap-3">
      <div>
        <div className="mt-0.5 grid gap-1.5">
          <FieldInput type="text" value={titleDraft} onChange={handleTitleChange} onBlur={handleTitleBlur} />
        </div>
      </div>

      <div>
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider">Created</span>
        <p className="text-[12px] text-text-secondary m-0 mt-0.5">
          {new Date(currentPresentation.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
