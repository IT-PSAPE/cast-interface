import { useCallback, useRef } from 'react'
import { GripHorizontal, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@renderer/utils/cn'
import { BlockMenu } from './doc-block-menu'
import type { Block } from './doc-editor'

export type SortableBlockProps = {
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
    onPaste: (before: string, lines: string[], after: string) => void
    onFocusPrev: () => void
    onFocusNext: () => void
}

export function SortableBlock({ block, isMenuOpen, contentRef, onUpdate, onEnter, onDelete, onMergeWithPrev, onMenuToggle, onMenuClose, onMenuAction, onAddBelow, onPaste, onFocusPrev, onFocusNext }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
    const style = { transform: CSS.Transform.toString(transform), transition }

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
            if (!sel?.rangeCount) return
            const range = sel.getRangeAt(0)
            if (!range.collapsed) return

            const atStart = (range.startOffset === 0 && range.startContainer === e.currentTarget)
                || (range.startOffset === 0 && range.startContainer === e.currentTarget.firstChild)

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

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData('text/plain')
        if (!text.includes('\n')) return

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
            const postRange = range.cloneRange()
            postRange.selectNodeContents(el)
            postRange.setStart(range.endContainer, range.endOffset)
            after = postRange.toString()
        }

        const lines = text.split('\n')
        onPaste(before, lines, after)
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
                    <Plus size={12} />
                </button>

                <div className="relative">
                    <button
                        type="button"
                        className="flex size-5.5 cursor-grab items-center justify-center rounded text-quaternary hover:bg-tertiary hover:text-secondary"
                        onClick={onMenuToggle}
                        {...listeners}
                        {...attributes}
                    >
                        <GripHorizontal size={12} />
                    </button>
                    {isMenuOpen ? (
                        <BlockMenu
                            onAction={action => {
                                onMenuClose()
                                onMenuAction(action)
                            }}
                            onClose={onMenuClose}
                        />
                    ) : null}
                </div>
            </div>

            <div
                ref={setContentRef}
                contentEditable
                suppressContentEditableWarning
                className="doc-block min-h-[1.7em] flex-1 break-words px-0.5 py-px text-paragraph-sm text-primary outline-none"
                data-placeholder="Type something..."
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onInput={e => onUpdate(e.currentTarget.textContent || '')}
            />
        </div>
    )
}
