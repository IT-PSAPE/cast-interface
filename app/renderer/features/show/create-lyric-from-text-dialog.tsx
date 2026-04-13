import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/controls/button';
import { FieldTextarea } from '../../components/form/field';
import { DialogFrame } from '../../components/overlays/dialog-frame';

interface CreateLyricFromTextDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export function CreateLyricFromTextDialog({ isOpen, isSubmitting, onClose, onSubmit }: CreateLyricFromTextDialogProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      return;
    }

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [isOpen]);

  function handleSubmit() {
    onSubmit(text);
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  if (!isOpen) return null;

  return (
    <DialogFrame
      title="Create lyric from text"
      onClose={handleClose}
      dataUiRegion="create-lyric-from-text-dialog"
      popupClassName="max-w-2xl"
      bodyClassName="bg-primary/95 px-4 py-4"
      footer={(
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="take" onClick={handleSubmit} disabled={isSubmitting || text.trim().length === 0}>Create</Button>
        </div>
      )}
    >
      <FieldTextarea
        textareaRef={textareaRef}
        value={text}
        onChange={setText}
        placeholder={'Paste lyric text here.\n\nSeparate slides with a blank line.'}
        rows={14}
        className="min-h-[320px] resize-none"
      />
    </DialogFrame>
  );
}
