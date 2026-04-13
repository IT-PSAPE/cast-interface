import type { ReactNode } from 'react';
import { Button } from '../../components/controls/button';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { DialogFrame } from '../../components/overlays/dialog-frame';
import { Panel } from '../../components/panel';

interface CreateLyricDialogProps {
  isBusy: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCreateEditableLyric: () => void;
  onCreateEmptyLyric: () => void;
}

export function CreateLyricDialog({ isBusy, isOpen, onClose, onCreateEditableLyric, onCreateEmptyLyric }: CreateLyricDialogProps) {
  if (!isOpen) return null;

  function handleClose() {
    if (isBusy) return;
    onClose();
  }

  return (
    <DialogFrame
      title="Create lyric"
      onClose={handleClose}
      dataUiRegion="create-lyric-dialog"
      popupClassName="max-w-2xl"
      bodyClassName="bg-primary/95 px-6 py-6"
    >
      <CreateLyricPanel
        entity="lyric"
        title="Lyric"
        description="Start with one slide, or open the lyric editor and generate slides when you save."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={onCreateEmptyLyric} disabled={isBusy} className="px-3 py-2 text-sm">
              Empty
            </Button>
            <Button variant="take" onClick={onCreateEditableLyric} disabled={isBusy} className="px-3 py-2 text-sm">
              Edit
            </Button>
          </div>
        )}
      />
    </DialogFrame>
  );
}

interface CreateLyricPanelProps {
  actions: ReactNode;
  description: string;
  entity: 'lyric';
  title: string;
}

function CreateLyricPanel({ actions, description, entity, title }: CreateLyricPanelProps) {
  return (
    <Panel.Root as="section" className="justify-between rounded-lg border border-primary bg-tertiary/20 p-6">
      <div className="flex flex-col gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary bg-primary text-secondary">
          <DeckItemIcon entity={entity} size={22} strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <h2 className="m-0 text-xl font-semibold text-primary">{title}</h2>
          <p className="m-0 max-w-xl text-sm text-secondary">{description}</p>
        </div>
      </div>
      <div className="pt-6">
        {actions}
      </div>
    </Panel.Root>
  );
}
