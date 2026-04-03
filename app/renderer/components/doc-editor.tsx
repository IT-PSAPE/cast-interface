import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from './icon'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@renderer/utils/cn'

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

// ─── Block Menu ─────────────────────────────────────────────────────

type BlockMenuProps = {
    onAction: (action: string) => void
    onClose: () => void
}

function BlockMenu({ onAction, onClose }: BlockMenuProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 50)
        return () => {
            clearTimeout(t)
            document.removeEventListener('mousedown', handler)
        }
    }, [onClose])

    const items = [
        { id: 'delete', icon: <Icon.trash_01 size={14} />, label: 'Delete block', danger: true },
        { id: 'duplicate', icon: <Icon.copy_01 size={14} />, label: 'Duplicate' },
        { id: 'sep' },
        { id: 'move-top', icon: <Icon.arrow_up size={14} />, label: 'Move to top' },
        { id: 'move-bottom', icon: <Icon.arrow_down size={14} />, label: 'Move to bottom' },
    ]

    return (
        <div
            ref={ref}
            className="absolute left-0 top-full z-50 mt-1.5 flex min-w-48 flex-col overflow-hidden rounded-md border border-secondary bg-primary p-1 shadow-lg"
        >
            {items.map(item =>
                item.id === 'sep' ? (
                    <div key="sep" className="my-1 h-px bg-secondary" />
                ) : (
                    <button
                        key={item.id}
                        type="button"
                        className={cn(
                            'flex items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-secondary',
                            item.danger ? 'text-error' : 'text-secondary',
                        )}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => onAction(item.id)}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ),
            )}
        </div>
    )
}

// ─── Sortable Block ─────────────────────────────────────────────────

type SortableBlockProps = {
    block: Block
    isMenuOpen: boolean
    contentRef: (el: HTMLDivElement | null) => void
    onUpdate: (content: string) => void
    onEnter: (afterContent: string) => void
    onDelete: () => void
    onMergeWithPrev: (text: string) => void
    onMenuToggle: () => void
    onMenuClose: () => void
    onMenuAction: (action: string) => void
    onAddBelow: () => void
    onFocusPrev: () => void
    onFocusNext: () => void
}

function SortableBlock({
    block,
    isMenuOpen,
    contentRef,
    onUpdate,
    onEnter,
    onDelete,
    onMergeWithPrev,
    onMenuToggle,
    onMenuClose,
    onMenuAction,
    onAddBelow,
    onFocusPrev,
    onFocusNext,
}: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const initialised = useRef(false)
    const setContentRef = useCallback(
        (el: HTMLDivElement | null) => {
            contentRef(el)
            if (el && !initialised.current) {
                el.textContent = block.content
                initialised.current = true
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const el = e.currentTarget
            const sel = window.getSelection()
            let before = ''
            let after = ''

            if (sel?.rangeCount) {
                const range = sel.getRangeAt(0)
                const preRange = range.cloneRange()
                preRange.selectNodeContents(el)
                preRange.setEnd(range.startContainer, range.startOffset)
                before = preRange.toString()
                after = (el.textContent || '').slice(before.length)
            }

            el.textContent = before
            onUpdate(before)
            onEnter(after)
        } else if (e.key === 'Backspace') {
            const sel = window.getSelection()
            const atStart = sel?.rangeCount
                && sel.getRangeAt(0).collapsed
                && sel.getRangeAt(0).startOffset === 0
                && sel.getRangeAt(0).startContainer === e.currentTarget
                || sel?.getRangeAt(0).startContainer === e.currentTarget.firstChild
                && sel?.getRangeAt(0).startOffset === 0

            if (!atStart) return

            e.preventDefault()
            const text = e.currentTarget.textContent || ''
            if (text === '') {
                onDelete()
            } else {
                onMergeWithPrev(text)
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            onFocusPrev()
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            onFocusNext()
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative flex items-start rounded-md',
                isDragging ? 'opacity-25' : 'hover:bg-secondary',
                isMenuOpen && 'bg-secondary',
            )}
        >
            {/* Left handles */}
            <div className={cn(
                'absolute -left-13 top-1/2 flex -translate-y-1/2 items-center gap-0.5 transition-opacity',
                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}>
                <button
                    type="button"
                    className="flex size-5.5 items-center justify-center rounded text-quaternary hover:bg-tertiary hover:text-secondary"
                    onMouseDown={e => e.preventDefault()}
                    onClick={onAddBelow}
                >
                    <Icon.plus size={12} />
                </button>

                <div className="relative">
                    <button
                        type="button"
                        className="flex size-5.5 cursor-grab items-center justify-center rounded text-quaternary hover:bg-tertiary hover:text-secondary"
                        onClick={onMenuToggle}
                        {...listeners}
                        {...attributes}
                    >
                        <Icon.dots_grid size={12} />
                    </button>
                    {isMenuOpen && (
                        <BlockMenu
                            onAction={action => {
                                onMenuClose()
                                onMenuAction(action)
                            }}
                            onClose={onMenuClose}
                        />
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                ref={setContentRef}
                contentEditable
                suppressContentEditableWarning
                className="doc-block min-h-[1.7em] flex-1 break-words px-0.5 py-px text-paragraph-sm text-primary outline-none"
                data-placeholder="Type something..."
                onKeyDown={handleKeyDown}
                onInput={e => onUpdate(e.currentTarget.textContent || '')}
            />
        </div>
    )
}

// ─── Doc Editor ─────────────────────────────────────────────────────

export default function DocEditor({
    initialBlocks,
    onChange,
}: DocEditorProps) {
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
        // Place cursor at the merge point in the previous block
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

            <div
                className="min-h-20 cursor-text pl-13 pt-1"
                onClick={() => {
                    const last = blocks[blocks.length - 1]
                    if (!last) return
                    if (!last.content) focusEnd(last.id)
                    else addBlockAfter(last.id)
                }}
            />
        </div>
    )
}
