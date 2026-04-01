import { useCallback } from 'react';
import { Button } from '../../../components/button';
import { ContextMenu } from '../../../components/context-menu';
import { DialogFrame } from '../../../components/dialog-frame';
import { useNavigation } from '../../../contexts/navigation-context';
import { useLyricEditorDocument, type LyricEditorRowState } from '../hooks/use-lyric-editor-document';
import { LyricEditorModalRow } from './lyric-editor-modal-row';

interface LyricEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LyricEditorModal({ isOpen, onClose }: LyricEditorModalProps) {
  const { currentContentItem } = useNavigation();
  const { state, actions } = useLyricEditorDocument({ isOpen, onClose });

  function handleSave() {
    void actions.saveRows();
  }

  const renderRow = useCallback((row: LyricEditorRowState, rowIndex: number) => (
    <LyricEditorModalRow
      key={row.key}
      row={row}
      rowIndex={rowIndex}
      isSaving={state.isSaving}
      isActive={state.activeRowKey === row.key}
      onFocusRow={actions.setActiveRow}
      onSetRowText={actions.setRowText}
      onSplitRow={actions.splitRow}
      onTextareaMount={actions.setTextareaMount}
      onOpenRowMenu={actions.openRowMenu}
      onOpenRowMenuFromButton={actions.openRowMenuFromButton}
      onHandleDragEnd={actions.handleRowDragEnd}
      onHandleDragOver={actions.handleRowDragOver}
      onHandleDragStart={actions.handleRowDragStart}
      onHandleDrop={actions.handleRowDrop}
      dragging={state.dragState?.activeRowKey === row.key}
      dropPlacement={state.dragState?.targetRowKey === row.key ? state.dragState.placement : null}
    />
  ), [actions, state.activeRowKey, state.dragState, state.isSaving]);

  const footer = (
    <>
      <Button variant="ghost" onClick={actions.addRow} disabled={state.isSaving}>Add Row</Button>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" onClick={onClose} disabled={state.isSaving}>Cancel</Button>
        <Button variant="take" onClick={handleSave} disabled={state.isSaving}>Save</Button>
      </div>
    </>
  );

  if (!isOpen || !currentContentItem || currentContentItem.type !== 'lyric') return null;

  return (
    <DialogFrame
      title="Lyric editor"
      onClose={onClose}
      dataUiRegion="lyric-editor-modal"
      bodyClassName="max-h-[74vh] overflow-auto bg-background-primary/95 px-0 py-0"
      footer={footer}
      popupClassName="max-w-4xl"
    >
      <div className="grid min-h-0 gap-0">
        <div className="border-b border-border-primary px-6 py-4">
          <div className="mx-auto grid max-w-3xl gap-1">
            <p className="text-sm font-medium text-text-primary">Block-based lyric document</p>
            <p className="text-sm leading-6 text-text-tertiary">Editor.js treats each paragraph as its own block instead of one giant editable surface. This editor follows that pattern: every lyric slide is an independent block with a left gutter handle for block actions and drag reordering.</p>
          </div>
        </div>

        {state.rows.length === 0 ? (
          <div className="grid justify-items-start gap-2 px-6 py-8">
            <div className="mx-auto grid w-full max-w-3xl justify-items-start gap-2 rounded-2xl border border-dashed border-border-primary bg-background-secondary/30 px-5 py-5">
              <p className="text-sm text-text-tertiary">No lyric slides yet.</p>
              <Button variant="ghost" onClick={actions.addRow} disabled={state.isSaving}>Add Row</Button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mx-auto grid w-full max-w-3xl gap-0">
              {state.rows.map(renderRow)}
            </div>
          </div>
        )}
      </div>

      {state.menuState ? (
        <ContextMenu
          x={state.menuState.x}
          y={state.menuState.y}
          items={state.menuItems}
          onClose={actions.closeMenu}
        />
      ) : null}
    </DialogFrame>
  );
}
