import { useState, useRef, useCallback, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableBlock } from './doc-sortable-block'

const uid = () => Math.random().toString(36).slice(2, 9)

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    const next = [...arr]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

export type Block = { id: string; content: string }

type DocEditorProps = {
    initialBlocks?: Block[]
    onChange?: (blocks: Block[]) => void
}

export default function DocEditor({ initialBlocks, onChange }: DocEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(
        () => initialBlocks ?? [{ id: uid(), content: '' }],
    )
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const blocksRef = useRef(blocks)
    useEffect(() => { blocksRef.current = blocks }, [blocks])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    )

    useEffect(() => {
        onChange?.(blocks)
    }, [blocks, onChange])

    // ── Focus helpers ───────────────────────────────────────────────

    const focusEnd = useCallback((id: string) => {
        requestAnimationFrame(() => {
            const el = contentRefs.current[id]
            if (!el) return
            el.focus()
            try {
                const range = document.createRange()
                range.selectNodeContents(el)
                range.collapse(false)
                window.getSelection()?.removeAllRanges()
                window.getSelection()?.addRange(range)
            } catch { /* empty */ }
        })
    }, [])

    const focusStart = useCallback((id: string) => {
        requestAnimationFrame(() => {
            const el = contentRefs.current[id]
            if (!el) return
            el.focus()
            try {
                const range = document.createRange()
                range.setStart(el.firstChild ?? el, 0)
                range.collapse(true)
                window.getSelection()?.removeAllRanges()
                window.getSelection()?.addRange(range)
            } catch { /* empty */ }
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
            if (content) el.textContent = content
            el.focus()
            try {
                const range = document.createRange()
                range.setStart(el.firstChild ?? el, 0)
                range.collapse(true)
                window.getSelection()?.removeAllRanges()
                window.getSelection()?.addRange(range)
            } catch { /* empty */ }
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
            el.textContent = prevBlock.content + text
            el.focus()
            try {
                const textNode = el.firstChild
                if (textNode) {
                    const range = document.createRange()
                    range.setStart(textNode, mergePoint)
                    range.collapse(true)
                    window.getSelection()?.removeAllRanges()
                    window.getSelection()?.addRange(range)
                }
            } catch { /* empty */ }
        })
    }, [])

    const pasteIntoBlock = useCallback((blockId: string, before: string, lines: string[], after: string) => {
        const firstLine = before + lines[0]
        const middleLines = lines.slice(1, -1)
        const lastLine = lines.length > 1 ? (lines[lines.length - 1] + after) : null

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
            const el = contentRefs.current[blockId]
            if (el) el.textContent = firstLine
            for (const newBlock of newBlocks) {
                const newEl = contentRefs.current[newBlock.id]
                if (newEl) newEl.textContent = newBlock.content
            }
            const focusEl = contentRefs.current[focusTargetId]
            if (!focusEl) return
            focusEl.focus()
            try {
                const textNode = focusEl.firstChild
                if (textNode) {
                    const cursorPos = lastLine !== null ? lastLine.length - after.length : firstLine.length
                    const range = document.createRange()
                    range.setStart(textNode, Math.min(cursorPos, textNode.textContent?.length ?? 0))
                    range.collapse(true)
                    window.getSelection()?.removeAllRanges()
                    window.getSelection()?.addRange(range)
                }
            } catch { /* empty */ }
        })
    }, [])

    const handleMenuAction = useCallback((blockId: string, action: string) => {
        if (action === 'delete') {
            deleteBlock(blockId)
        } else if (action === 'duplicate') {
            const block = blocksRef.current.find(b => b.id === blockId)
            if (block) addBlockAfter(blockId, block.content)
        } else if (action === 'move-top' || action === 'move-bottom') {
            setBlocks(prev => {
                const idx = prev.findIndex(b => b.id === blockId)
                if (idx === -1) return prev
                const next = [...prev]
                const [moved] = next.splice(idx, 1)
                return action === 'move-top' ? [moved, ...next] : [...next, moved]
            })
        }
    }, [deleteBlock, addBlockAfter])

    function handleDragEnd(event: DragEndEvent) {
        setOpenMenu(null)
        const { active, over } = event
        if (!over || active.id === over.id) return
        setBlocks(prev => {
            const oldIndex = prev.findIndex(b => b.id === active.id)
            const newIndex = prev.findIndex(b => b.id === over.id)
            return arrayMove(prev, oldIndex, newIndex)
        })
    }

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div className="w-full max-w-[680px]">
            <div className="">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {blocks.map((block, index) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                isMenuOpen={openMenu === block.id}
                                contentRef={el => { contentRefs.current[block.id] = el }}
                                onUpdate={content => updateBlock(block.id, content)}
                                onEnter={content => addBlockAfter(block.id, content)}
                                onDelete={() => deleteBlock(block.id)}
                                onMergeWithPrev={text => mergeWithPrev(block.id, text)}
                                onMenuToggle={() => setOpenMenu(prev => prev === block.id ? null : block.id)}
                                onMenuClose={() => setOpenMenu(null)}
                                onMenuAction={action => handleMenuAction(block.id, action)}
                                onAddBelow={() => addBlockAfter(block.id)}
                                onPaste={(before, lines, after) => pasteIntoBlock(block.id, before, lines, after)}
                                onFocusPrev={() => {
                                    const prev = blocks[index - 1]
                                    if (prev) focusEnd(prev.id)
                                }}
                                onFocusNext={() => {
                                    const next = blocks[index + 1]
                                    if (next) focusStart(next.id)
                                }}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    )
}
