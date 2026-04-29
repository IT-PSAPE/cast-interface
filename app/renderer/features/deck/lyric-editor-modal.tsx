import { useEffect, useRef } from 'react';
import { ReacstButton } from '@renderer/components/controls/button';
import { Dialog } from '../../components/overlays/dialog';
import DocEditor, { type Block } from '../../components/form/doc-editor';
import { useNavigation } from '../../contexts/navigation-context';
import { useLyricEditorSave } from './use-lyric-editor-document';

interface LyricEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LyricEditorModal({ isOpen, onClose }: LyricEditorModalProps) {
  const { currentDeckItem } = useNavigation();
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

  if (!isOpen || !currentDeckItem || currentDeckItem.type !== 'lyric') return null;

  return (
    <Dialog.Root open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-ui-region="lyric-editor-modal" className="h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]">
            <Dialog.Header>
              <Dialog.Title>Lyric editor</Dialog.Title>
              <Dialog.CloseButton />
            </Dialog.Header>
            <Dialog.Body className="h-full overflow-auto bg-primary/95 px-0 py-0">
              <div className="min-h-80 px-6 py-5">
                <div className="mx-auto flex max-w-3xl justify-center">
                  <DocEditor initialBlocks={initialBlocks} onChange={handleChange} />
                </div>
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <div className="ml-auto flex items-center gap-2">
                <ReacstButton variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</ReacstButton>
                <ReacstButton variant="take" onClick={handleSave} disabled={isSaving}>Save</ReacstButton>
              </div>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
