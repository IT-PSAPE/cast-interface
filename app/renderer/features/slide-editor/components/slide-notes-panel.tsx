import { Button } from '../../../components/button';
import { FieldTextarea } from '../../../components/labeled-field';
import { useSlideNotesPanel } from '../hooks/use-slide-notes-panel';

export function SlideNotesPanel() {
  const {
    canEdit,
    notesDraft,
    isDirty,
    hasSlide,
    placeholder,
    handleNotesChange,
    handleSaveNotes,
    handleResetNotes,
  } = useSlideNotesPanel();

  return (
    <section className="relative h-full min-h-0 overflow-hidden border-t border-border-primary bg-background-primary/70">
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end">
        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-border-primary bg-background-primary_alt/95 p-1 shadow-sm backdrop-blur-sm">
          <Button onClick={handleResetNotes} disabled={!hasSlide || !isDirty} variant="ghost">
            Reset
          </Button>
          <Button onClick={handleSaveNotes} disabled={!canEdit || !isDirty}>
            Save
          </Button>
        </div>
      </div>
      <FieldTextarea
        value={notesDraft}
        onChange={handleNotesChange}
        placeholder={placeholder}
        className="h-full min-h-0 w-full resize-none rounded-none border-0 bg-transparent px-3 pb-3 pt-14 leading-relaxed focus:border-0"
      />
    </section>
  );
}
