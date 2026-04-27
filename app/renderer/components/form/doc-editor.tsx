import { useState, useRef, useCallback, useEffect } from 'react'
import { SortableBlock } from './doc-sortable-block'
import { BlockMenu } from './doc-block-menu'

const uid = () => Math.random().toString(36).slice(2, 9)

export type Block = { id: string; content: string }

type DocEditorProps = {
    initialBlocks?: Block[]
    onChange?: (blocks: Block[]) => void
}

type MenuState = { x: number; y: number; anchorBlockId: string }

export default function DocEditor({ initialBlocks, onChange }: DocEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(
        () => initialBlocks ?? [{ id: uid(), content: '' }],
    )
    const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(() => new Set())
    const [menuState, setMenuState] = useState<MenuState | null>(null)

    const contentRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
    const blocksRef = useRef(blocks)
    const selectedRef = useRef(selectedBlockIds)
    const rootRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => { blocksRef.current = blocks }, [blocks])
    useEffect(() => { selectedRef.current = selectedBlockIds }, [selectedBlockIds])

    useEffect(() => {
        onChange?.(blocks)
    }, [blocks, onChange])

    // ── Focus helpers ───────────────────────────────────────────────

    const focusEnd = useCallback((id: string) => {
        requestAnimationFrame(() => {
            const el = contentRefs.current[id]
            if (!el) return
            el.focus()
            const end = el.value.length
            el.setSelectionRange(end, end)
        })
    }, [])

    // ── Block operations ────────────────────────────────────────────

    const addBlockAfter = useCallback((afterId: string, content = '') => {
        const newId = uid()
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === afterId)
            const next = [...prev]
            next.splice(idx + 1, 0, { id: newId, content })
            return next
        })
        requestAnimationFrame(() => {
            const el = contentRefs.current[newId]
            if (!el) return
            el.focus()
            el.setSelectionRange(0, 0)
        })
    }, [])

    const deleteBlock = useCallback((id: string) => {
        const curr = blocksRef.current
        if (curr.length <= 1) return
        const idx = curr.findIndex(b => b.id === id)
        const prevBlock = curr[idx - 1]
        setBlocks(prev => prev.filter(b => b.id !== id))
        if (prevBlock) focusEnd(prevBlock.id)
    }, [focusEnd])

    const updateBlock = useCallback((id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
    }, [])

    const splitBlock = useCallback((blockId: string, before: string, after: string) => {
        const newId = uid()
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === blockId)
            if (idx === -1) return prev
            const next = [...prev]
            next[idx] = { ...next[idx], content: before }
            next.splice(idx + 1, 0, { id: newId, content: after })
            return next
        })
        requestAnimationFrame(() => {
            const el = contentRefs.current[newId]
            if (!el) return
            el.focus()
            el.setSelectionRange(0, 0)
        })
    }, [])

    const mergeWithPrev = useCallback((id: string, text: string) => {
        const curr = blocksRef.current
        const idx = curr.findIndex(b => b.id === id)
        if (idx <= 0) return
        const prevBlock = curr[idx - 1]
        const mergePoint = prevBlock.content.length
        setBlocks(prev => prev
            .map(b => b.id === prevBlock.id ? { ...b, content: b.content + text } : b)
            .filter(b => b.id !== id),
        )
        requestAnimationFrame(() => {
            const el = contentRefs.current[prevBlock.id]
            if (!el) return
            el.focus()
            el.setSelectionRange(mergePoint, mergePoint)
        })
    }, [])

    const pasteIntoBlock = useCallback((blockId: string, before: string, segments: string[], after: string) => {
        const firstLine = before + segments[0]
        const middleLines = segments.slice(1, -1)
        const lastLine = segments.length > 1 ? (segments[segments.length - 1] + after) : null

        const newBlocks: Block[] = middleLines.map(line => ({ id: uid(), content: line }))
        const lastId = lastLine !== null ? uid() : null
        if (lastId !== null && lastLine !== null) {
            newBlocks.push({ id: lastId, content: lastLine })
        }

        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === blockId)
            if (idx === -1) return prev
            const updated = [...prev]
            updated[idx] = { ...updated[idx], content: firstLine }
            updated.splice(idx + 1, 0, ...newBlocks)
            return updated
        })

        const focusTargetId = lastId ?? blockId
        requestAnimationFrame(() => {
            const focusEl = contentRefs.current[focusTargetId]
            if (!focusEl) return
            focusEl.focus()
            const cursorPos = lastLine !== null ? lastLine.length - after.length : firstLine.length
            focusEl.setSelectionRange(cursorPos, cursorPos)
        })
    }, [])

    // ── Selection ───────────────────────────────────────────────────

    const clearSelection = useCallback(() => {
        setSelectedBlockIds(prev => (prev.size === 0 ? prev : new Set()))
    }, [])

    const deleteSelectedBlocks = useCallback(() => {
        const selected = selectedRef.current
        if (selected.size === 0) return
        const curr = blocksRef.current
        if (curr.length <= selected.size) {
            // Don't allow deleting all — keep one empty block
            const keepId = uid()
            setBlocks([{ id: keepId, content: '' }])
            clearSelection()
            requestAnimationFrame(() => {
                const el = contentRefs.current[keepId]
                el?.focus()
            })
            return
        }
        const firstSelectedIdx = curr.findIndex(b => selected.has(b.id))
        const focusTargetIdx = Math.max(0, firstSelectedIdx - 1)
        const focusTargetId = curr.filter(b => !selected.has(b.id))[Math.min(focusTargetIdx, curr.length - selected.size - 1)]?.id
        setBlocks(prev => prev.filter(b => !selected.has(b.id)))
        clearSelection()
        if (focusTargetId) focusEnd(focusTargetId)
    }, [clearSelection, focusEnd])

    const moveSelectedBlocks = useCallback((direction: 'up' | 'down') => {
        const selected = selectedRef.current
        if (selected.size === 0) return
        setBlocks(prev => {
            const selectedIndices = prev
                .map((b, i) => (selected.has(b.id) ? i : -1))
                .filter(i => i >= 0)
            if (selectedIndices.length === 0) return prev
            if (direction === 'up' && selectedIndices[0] === 0) return prev
            if (direction === 'down' && selectedIndices[selectedIndices.length - 1] === prev.length - 1) return prev
            const next = [...prev]
            const ordered = direction === 'up' ? selectedIndices : [...selectedIndices].reverse()
            const delta = direction === 'up' ? -1 : 1
            for (const idx of ordered) {
                const swap = idx + delta
                ;[next[swap], next[idx]] = [next[idx], next[swap]]
            }
            return next
        })
    }, [])

    // Focus the root when selection becomes active so keyboard handlers receive events.
    useEffect(() => {
        if (selectedBlockIds.size === 0) return
        if (document.activeElement instanceof HTMLTextAreaElement) return
        rootRef.current?.focus()
    }, [selectedBlockIds])

    const handleRootKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (selectedBlockIds.size === 0) return
        if (event.target instanceof HTMLTextAreaElement) return
        if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault()
            event.stopPropagation()
            deleteSelectedBlocks()
            return
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            event.stopPropagation()
            moveSelectedBlocks('up')
            return
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            event.stopPropagation()
            moveSelectedBlocks('down')
            return
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            clearSelection()
        }
    }, [clearSelection, deleteSelectedBlocks, moveSelectedBlocks, selectedBlockIds.size])

    // ── Menu ────────────────────────────────────────────────────────

    const openMenuForBlock = useCallback((event: React.MouseEvent, blockId: string) => {
        event.preventDefault()
        // If the block isn't already part of the selection, make it the sole selection.
        setSelectedBlockIds(prev => (prev.has(blockId) ? prev : new Set([blockId])))
        setMenuState({ x: event.clientX, y: event.clientY, anchorBlockId: blockId })
    }, [])

    const closeMenu = useCallback(() => {
        setMenuState(null)
    }, [])

    const duplicateSelected = useCallback(() => {
        const selected = selectedRef.current
        if (selected.size === 0) return
        setBlocks(prev => {
            const next: Block[] = []
            for (const block of prev) {
                next.push(block)
                if (selected.has(block.id)) {
                    next.push({ id: uid(), content: block.content })
                }
            }
            return next
        })
    }, [])

    const handleMenuAction = useCallback((action: string) => {
        closeMenu()
        if (action === 'delete') {
            deleteSelectedBlocks()
        } else if (action === 'duplicate') {
            duplicateSelected()
        } else if (action === 'move-up') {
            moveSelectedBlocks('up')
        } else if (action === 'move-down') {
            moveSelectedBlocks('down')
        }
    }, [closeMenu, deleteSelectedBlocks, duplicateSelected, moveSelectedBlocks])

    const handleTextareaFocus = useCallback(() => {
        clearSelection()
    }, [clearSelection])

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            onKeyDown={handleRootKeyDown}
            className="w-full max-w-[680px] outline-none"
        >
            <div className="space-y-0.5">
                {blocks.map((block) => (
                    <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockIds.has(block.id)}
                        contentRef={el => { contentRefs.current[block.id] = el }}
                        onUpdate={content => updateBlock(block.id, content)}
                        onSplit={(before, after) => splitBlock(block.id, before, after)}
                        onDelete={() => deleteBlock(block.id)}
                        onMergeWithPrev={text => mergeWithPrev(block.id, text)}
                        onContextMenu={event => openMenuForBlock(event, block.id)}
                        onAddBelow={() => addBlockAfter(block.id)}
                        onTextareaFocus={handleTextareaFocus}
                        onPaste={(before, segments, after) => pasteIntoBlock(block.id, before, segments, after)}
                    />
                ))}
            </div>
            {menuState ? (
                <BlockMenu
                    x={menuState.x}
                    y={menuState.y}
                    onAction={handleMenuAction}
                    onClose={closeMenu}
                />
            ) : null}
        </div>
    )
}
