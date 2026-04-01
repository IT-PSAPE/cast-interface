import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ElementCreateInput, Id, Slide, SlideElement } from '@core/types';
import { Icon } from '../../../components/icon';
import type { ContextMenuItem } from '../../../components/context-menu';
import { useCast } from '../../../contexts/cast-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlides } from '../../../contexts/slide-context';
import { slideTextDetails } from '../../../utils/slides';

export interface LyricEditorRowState {
  key: string;
  slideId: Id | null;
  text: string;
}

interface FocusTarget {
  rowKey: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface LyricEditorMenuState {
  rowKey: string;
  x: number;
  y: number;
}

export type DropPlacement = 'before' | 'after';

interface DragState {
  activeRowKey: string;
  targetRowKey: string;
  placement: DropPlacement;
}

interface LyricEditorDocumentState {
  rows: LyricEditorRowState[];
  isSaving: boolean;
  menuItems: ContextMenuItem[];
  menuState: LyricEditorMenuState | null;
  dragState: DragState | null;
  activeRowKey: string | null;
}

interface LyricEditorDocumentActions {
  addRow: () => void;
  closeMenu: () => void;
  openRowMenu: (rowKey: string, x: number, y: number) => void;
  openRowMenuFromButton: (rowKey: string, button: HTMLElement) => void;
  saveRows: () => Promise<void>;
  setActiveRow: (rowKey: string | null) => void;
  setRowText: (rowKey: string, text: string) => void;
  setTextareaMount: (rowKey: string, node: HTMLTextAreaElement | null) => void;
  splitRow: (rowKey: string, textarea: HTMLTextAreaElement) => void;
  handleRowDragEnd: () => void;
  handleRowDragOver: (rowKey: string, placement: DropPlacement, event: React.DragEvent<HTMLElement>) => void;
  handleRowDragStart: (rowKey: string, event: React.DragEvent<HTMLButtonElement>) => void;
  handleRowDrop: (rowKey: string, placement: DropPlacement, event: React.DragEvent<HTMLElement>) => void;
}

interface LyricEditorDocumentResult {
  state: LyricEditorDocumentState;
  actions: LyricEditorDocumentActions;
}

function createDraftRow(text = ''): LyricEditorRowState {
  return {
    key: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    slideId: null,
    text,
  };
}

function buildRowState(slides: Slide[], slideElementsBySlideId: ReadonlyMap<Id, SlideElement[]>): LyricEditorRowState[] {
  return slides.map((slide) => ({
    key: slide.id,
    slideId: slide.id,
    text: slideTextDetails(slideElementsBySlideId.get(slide.id) ?? []).text,
  }));
}

function findTextElement(elements: SlideElement[]): SlideElement | null {
  return elements.find((element) => element.type === 'text' && 'text' in element.payload) ?? null;
}

function reorderRows(rows: LyricEditorRowState[], movingRowKey: string, targetRowKey: string, placement: DropPlacement): LyricEditorRowState[] {
  if (movingRowKey === targetRowKey) return rows;

  const fromIndex = rows.findIndex((row) => row.key === movingRowKey);
  const targetIndex = rows.findIndex((row) => row.key === targetRowKey);
  if (fromIndex === -1 || targetIndex === -1) return rows;

  const nextRows = [...rows];
  const [movingRow] = nextRows.splice(fromIndex, 1);
  const adjustedTargetIndex = nextRows.findIndex((row) => row.key === targetRowKey);
  const insertIndex = placement === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;
  nextRows.splice(insertIndex, 0, movingRow);
  return nextRows;
}

function createFallbackLyricTextElement(slideId: Id, text: string): ElementCreateInput {
  return {
    slideId,
    type: 'text',
    x: 180,
    y: 860,
    width: 1560,
    height: 170,
    payload: {
      text,
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      verticalAlign: 'middle',
      lineHeight: 1.2,
      caseTransform: 'none',
      weight: '700',
      visible: true,
      locked: false,
      fillEnabled: false,
      fillColor: '#00000000',
      strokeEnabled: false,
      shadowEnabled: false,
    },
  };
}

export function useLyricEditorDocument({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): LyricEditorDocumentResult {
  const { currentContentItem } = useNavigation();
  const { slides } = useSlides();
  const { slideElementsBySlideId } = useProjectContent();
  const { mutate, setStatusText } = useCast();
  const lyricId = currentContentItem?.type === 'lyric' ? currentContentItem.id : null;
  const initialRows = useMemo(() => {
    if (!currentContentItem || currentContentItem.type !== 'lyric') return [];
    return buildRowState(slides, slideElementsBySlideId);
  }, [currentContentItem, slideElementsBySlideId, slides]);
  const [rows, setRows] = useState<LyricEditorRowState[]>(initialRows);
  const [isSaving, setIsSaving] = useState(false);
  const [menuState, setMenuState] = useState<LyricEditorMenuState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);
  const rowInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const pendingFocusRef = useRef<FocusTarget | null>(null);
  const initialRowsRef = useRef<LyricEditorRowState[]>(initialRows);

  useEffect(() => {
    initialRowsRef.current = initialRows;
  }, [initialRows]);

  useEffect(() => {
    if (!isOpen || !lyricId) return;
    setRows(initialRowsRef.current);
    setMenuState(null);
    setDragState(null);
    setActiveRowKey(initialRowsRef.current[0]?.key ?? null);
  }, [isOpen, lyricId]);

  useEffect(() => {
    const pendingFocus = pendingFocusRef.current;
    if (!pendingFocus) return;
    const textarea = rowInputRefs.current[pendingFocus.rowKey];
    if (!textarea) return;
    textarea.focus();
    textarea.selectionStart = pendingFocus.selectionStart;
    textarea.selectionEnd = pendingFocus.selectionEnd;
    pendingFocusRef.current = null;
  }, [rows]);

  const setPendingFocus = useCallback((rowKey: string, selectionStart: number, selectionEnd = selectionStart) => {
    pendingFocusRef.current = { rowKey, selectionStart, selectionEnd };
  }, []);

  const setRowText = useCallback((rowKey: string, text: string) => {
    setRows((previous) => previous.map((row) => (row.key === rowKey ? { ...row, text } : row)));
  }, []);

  const moveRow = useCallback((rowKey: string, direction: -1 | 1) => {
    setRows((previous) => {
      const fromIndex = previous.findIndex((row) => row.key === rowKey);
      const toIndex = fromIndex + direction;
      if (fromIndex === -1 || toIndex < 0 || toIndex >= previous.length) return previous;
      const nextRows = [...previous];
      const [movedRow] = nextRows.splice(fromIndex, 1);
      nextRows.splice(toIndex, 0, movedRow);
      return nextRows;
    });
  }, []);

  const removeRow = useCallback((rowKey: string) => {
    setRows((previous) => previous.filter((row) => row.key !== rowKey));
    setMenuState((previous) => (previous?.rowKey === rowKey ? null : previous));
    setActiveRowKey((previous) => (previous === rowKey ? null : previous));
  }, []);

  const addRow = useCallback(() => {
    const nextRow = createDraftRow('');
    setRows((previous) => [...previous, nextRow]);
    setPendingFocus(nextRow.key, 0);
    setActiveRowKey(nextRow.key);
  }, [setPendingFocus]);

  const splitRow = useCallback((rowKey: string, textarea: HTMLTextAreaElement) => {
    const cursor = textarea.selectionStart ?? textarea.value.length;
    const nextRow = createDraftRow();

    setRows((previous) => {
      const rowIndex = previous.findIndex((row) => row.key === rowKey);
      if (rowIndex === -1) return previous;
      const row = previous[rowIndex];
      const nextRows = [...previous];
      nextRows[rowIndex] = { ...row, text: row.text.slice(0, cursor) };
      nextRows.splice(rowIndex + 1, 0, { ...nextRow, text: row.text.slice(cursor) });
      return nextRows;
    });

    setPendingFocus(nextRow.key, 0);
    setActiveRowKey(nextRow.key);
  }, [setPendingFocus]);

  const setTextareaMount = useCallback((rowKey: string, node: HTMLTextAreaElement | null) => {
    rowInputRefs.current[rowKey] = node;
  }, []);

  const duplicateRow = useCallback((rowKey: string) => {
    const nextRow = createDraftRow();

    setRows((previous) => {
      const rowIndex = previous.findIndex((row) => row.key === rowKey);
      if (rowIndex === -1) return previous;
      const sourceRow = previous[rowIndex];
      const nextRows = [...previous];
      nextRows.splice(rowIndex + 1, 0, { ...nextRow, text: sourceRow.text });
      return nextRows;
    });

    setPendingFocus(nextRow.key, 0);
    setActiveRowKey(nextRow.key);
  }, [setPendingFocus]);

  const closeMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const openRowMenu = useCallback((rowKey: string, x: number, y: number) => {
    setMenuState({ rowKey, x, y });
    setActiveRowKey(rowKey);
  }, []);

  const openRowMenuFromButton = useCallback((rowKey: string, button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    openRowMenu(rowKey, rect.left, rect.bottom + 6);
  }, [openRowMenu]);

  const handleRowDragStart = useCallback((rowKey: string, event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', rowKey);
    setDragState({
      activeRowKey: rowKey,
      targetRowKey: rowKey,
      placement: 'after',
    });
    setActiveRowKey(rowKey);
  }, []);

  const handleRowDragEnd = useCallback(() => {
    setDragState(null);
  }, []);

  const handleRowDragOver = useCallback((rowKey: string, placement: DropPlacement, event: React.DragEvent<HTMLElement>) => {
    if (!dragState) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragState.activeRowKey === rowKey && dragState.placement === placement) return;
    setDragState((previous) => previous ? { ...previous, targetRowKey: rowKey, placement } : previous);
  }, [dragState]);

  const handleRowDrop = useCallback((rowKey: string, placement: DropPlacement, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const movingRowKey = dragState?.activeRowKey ?? event.dataTransfer.getData('text/plain');
    if (!movingRowKey) return;

    setRows((previous) => reorderRows(previous, movingRowKey, rowKey, placement));
    setDragState(null);
    setActiveRowKey(movingRowKey);
  }, [dragState]);

  const saveRowText = useCallback(async (slideId: Id, text: string, currentElements: SlideElement[]) => {
    const textElement = findTextElement(currentElements);
    if (textElement && 'text' in textElement.payload) {
      const currentText = String(textElement.payload.text ?? '');
      if (currentText !== text) {
        await mutate(() => window.castApi.updateElement({
          id: textElement.id,
          payload: {
            ...textElement.payload,
            text,
          },
        }));
      }
      return;
    }

    await mutate(() => window.castApi.createElement(createFallbackLyricTextElement(slideId, text)));
  }, [mutate]);

  const createSlideForRow = useCallback(async (nextLyricId: Id, text: string) => {
    const snapshot = await mutate(() => window.castApi.createSlide({ lyricId: nextLyricId }));
    const nextSlide = snapshot.slides
      .filter((slide) => slide.lyricId === nextLyricId)
      .sort((left, right) => right.order - left.order)
      .at(0);

    if (!nextSlide) {
      throw new Error('Unable to create lyric slide.');
    }

    const nextSlideElements = snapshot.slideElements.filter((element) => element.slideId === nextSlide.id);
    await saveRowText(nextSlide.id, text, nextSlideElements);
    return nextSlide.id;
  }, [mutate, saveRowText]);

  const saveRows = useCallback(async () => {
    if (!currentContentItem || currentContentItem.type !== 'lyric') return;

    setIsSaving(true);

    try {
      const removedSlideIds = slides
        .filter((slide) => !rows.some((row) => row.slideId === slide.id))
        .map((slide) => slide.id);

      for (const slideId of removedSlideIds) {
        await mutate(() => window.castApi.deleteSlide(slideId));
      }

      const orderedSlideIds: Id[] = [];

      for (const row of rows) {
        if (row.slideId) {
          await saveRowText(row.slideId, row.text, slideElementsBySlideId.get(row.slideId) ?? []);
          orderedSlideIds.push(row.slideId);
          continue;
        }

        const createdSlideId = await createSlideForRow(currentContentItem.id, row.text);
        orderedSlideIds.push(createdSlideId);
      }

      for (const [index, slideId] of orderedSlideIds.entries()) {
        await mutate(() => window.castApi.setSlideOrder({ slideId, newOrder: index }));
      }

      setStatusText('Saved lyrics');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save lyrics.';
      setStatusText(message);
    } finally {
      setIsSaving(false);
    }
  }, [createSlideForRow, currentContentItem, mutate, onClose, rows, saveRowText, setStatusText, slideElementsBySlideId, slides]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menuState) return [];
    const rowIndex = rows.findIndex((row) => row.key === menuState.rowKey);
    if (rowIndex === -1) return [];

    return [
      {
        id: 'move-up',
        label: 'Move Up',
        icon: <Icon.chevron_up size={14} strokeWidth={2} />,
        disabled: rowIndex === 0,
        onSelect: () => { moveRow(menuState.rowKey, -1); },
      },
      {
        id: 'move-down',
        label: 'Move Down',
        icon: <Icon.chevron_down size={14} strokeWidth={2} />,
        disabled: rowIndex === rows.length - 1,
        onSelect: () => { moveRow(menuState.rowKey, 1); },
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: <Icon.copy_01 size={14} strokeWidth={1.8} />,
        onSelect: () => { duplicateRow(menuState.rowKey); },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Icon.trash_01 size={14} strokeWidth={1.8} />,
        danger: true,
        onSelect: () => { removeRow(menuState.rowKey); },
      },
    ];
  }, [duplicateRow, menuState, moveRow, removeRow, rows]);

  return {
    state: {
      rows,
      isSaving,
      menuItems,
      menuState,
      dragState,
      activeRowKey,
    },
    actions: {
      addRow,
      closeMenu,
      openRowMenu,
      openRowMenuFromButton,
      saveRows,
      setActiveRow: setActiveRowKey,
      setRowText,
      setTextareaMount,
      splitRow,
      handleRowDragEnd,
      handleRowDragOver,
      handleRowDragStart,
      handleRowDrop,
    },
  };
}
