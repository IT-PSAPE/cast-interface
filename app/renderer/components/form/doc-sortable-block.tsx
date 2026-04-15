import { useCallback, useEffect, useRef } from 'react'
import { GripHorizontal, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@renderer/utils/cn'
import { BlockMenu } from './doc-block-menu'
import type { Block } from './doc-editor'

export type SortableBlockProps = {
    block: Block
    isMenuOpen: boolean
    contentRef: (el: HTMLTextAreaElement | null) => void
    onUpdate: (content: string) => void
    onSplit: (before: string, after: string) => void
    onDelete: () => void
    onMergeWithPrev: (text: string) => void
    onMenuToggle: () => void
    onMenuClose: () => void
    onMenuAction: (action: string) => void
    onAddBelow: () => void
    onPaste: (before: string, segments: string[], after: string) => void
}

function splitPastedSegments(text: string): string[] {
    return text
        .replace(/\r\n/g, '\n')
        .split(/\n\s*\n/g)
}

function resizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
}

export function SortableBlock({ block, isMenuOpen, contentRef, onUpdate, onSplit, onDelete, onMergeWithPrev, onMenuToggle, onMenuClose, onMenuAction, onAddBelow, onPaste }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
    const style = { transform: CSS.Transform.toString(transform), transition }
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const setContentRef = useCallback(
        (el: HTMLTextAreaElement | null) => {
            textareaRef.current = el
            contentRef(el)
        },
        [contentRef],
    )

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        resizeTextarea(textarea)
    }, [block.content])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const { selectionStart, selectionEnd, value } = e.currentTarget
            onSplit(value.slice(0, selectionStart), value.slice(selectionEnd))
            return
        }

        if (e.key === 'Backspace' && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
            e.preventDefault()
            if (e.currentTarget.value === '') {
                onDelete()
                return
            }

            onMergeWithPrev(e.currentTarget.value)
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData('text/plain')
        const segments = splitPastedSegments(text)
        if (segments.length <= 1) return

        e.preventDefault()
        const { selectionStart, selectionEnd, value } = e.currentTarget
        onPaste(value.slice(0, selectionStart), segments, value.slice(selectionEnd))
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate(e.currentTarget.value)
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

            <textarea
                ref={setContentRef}
                value={block.content}
                rows={1}
                spellCheck={false}
                className="doc-block min-h-[1.7em] flex-1 resize-none overflow-hidden whitespace-pre-wrap bg-transparent px-0.5 py-px text-paragraph-sm text-primary outline-none placeholder:text-tertiary"
                placeholder="Type something..."
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onChange={handleChange}
            />
        </div>
    )
}
