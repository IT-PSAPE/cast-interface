import { useEffect, useRef } from 'react';
import { Button } from '../../../components/button';
import { DialogFrame } from '../../../components/dialog-frame';
import DocEditor, { type Block } from '../../../components/doc-editor';
import { useNavigation } from '../../../contexts/navigation-context';
import { useLyricEditorSave } from '../hooks/use-lyric-editor-document';

interface LyricEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LyricEditorModal({ isOpen, onClose }: LyricEditorModalProps) {
  const { currentContentItem } = useNavigation();
  const { initialBlocks, saveBlocks, isSaving } = useLyricEditorSave({ isOpen, onClose });
  const blocksRef = useRef<Block[]>(initialBlocks);

  useEffect(() => {
    if (isOpen) blocksRef.current = initialBlocks;
  }, [isOpen, initialBlocks]);

  function handleChange(blocks: Block[]) {
    blocksRef.current = blocks;
  }

  function handleSave() {
    void saveBlocks(blocksRef.current);
  }

  if (!isOpen || !currentContentItem || currentContentItem.type !== 'lyric') return null;

  const footer = (
    <div className="ml-auto flex items-center gap-2">
      <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
      <Button variant="take" onClick={handleSave} disabled={isSaving}>Save</Button>
    </div>
  );

  return (
    <DialogFrame
      title="Lyric editor"
      onClose={onClose}
      dataUiRegion="lyric-editor-modal"
      bodyClassName="max-h-[74vh] overflow-auto bg-background-primary/95 px-0 py-0"
      footer={footer}
      popupClassName="max-w-4xl"
    >
      <div className="px-6 py-5">
        <div className="mx-auto flex max-w-3xl justify-center pl-13">
          <DocEditor
            initialBlocks={initialBlocks}
            onChange={handleChange}
          />
        </div>
      </div>
    </DialogFrame>
  );
}
