import { useCallback, useEffect, useRef } from 'react'
import { GripHorizontal, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@renderer/utils/cn'
import type { Block } from './doc-editor'
import { Button } from '../controls/button'

export type SortableBlockProps = {
    block: Block
    isSelected: boolean
    isGroupDragging: boolean
    contentRef: (el: HTMLTextAreaElement | null) => void
    onUpdate: (content: string) => void
    onSplit: (before: string, after: string) => void
    onDelete: () => void
    onMergeWithPrev: (text: string) => void
    onGripClick: (event: React.MouseEvent) => void
    onContextMenu: (event: React.MouseEvent) => void
    onAddBelow: () => void
    onTextareaFocus: () => void
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

export function SortableBlock({ block, isSelected, isGroupDragging, contentRef, onUpdate, onSplit, onDelete, onMergeWithPrev, onGripClick, onContextMenu, onAddBelow, onTextareaFocus, onPaste }: SortableBlockProps) {
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

    const handleRowContextMenu = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
        onContextMenu(e)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onContextMenu={handleRowContextMenu}
            className={cn( 'group relative flex items-start rounded-md px-1 py-0.5 pt-1.25', isDragging || isGroupDragging ? 'opacity-25' : 'hover:bg-tertiary', isSelected && '!bg-brand_solid/10', )}
        >
            <div className={cn('flex absolute -left-13  items-center gap-0.5 transition-opacity','opacity-0 group-hover:opacity-100',)}>
                <Button.Icon variant='ghost' onMouseDown={e => e.preventDefault()} onClick={onAddBelow}>
                    <Plus />
                </Button.Icon>
                <Button.Icon variant='ghost' onClick={onGripClick} {...listeners} {...attributes}>
                    <GripHorizontal />
                </Button.Icon>
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
                onFocus={onTextareaFocus}
            />
        </div>
    )
}
