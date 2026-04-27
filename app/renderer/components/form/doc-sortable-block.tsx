import { useCallback, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@renderer/utils/cn'
import type { Block } from './doc-editor'
import { ReacstButton } from '@renderer/components 2.0/button'
import { Label } from '../display/text'

export type SortableBlockProps = {
    index: number
    block: Block
    isSelected: boolean
    contentRef: (el: HTMLTextAreaElement | null) => void
    onUpdate: (content: string) => void
    onSplit: (before: string, after: string) => void
    onDelete: () => void
    onMergeWithPrev: (text: string) => void
    onAddBelow: () => void
    onTextareaFocus: () => void
    onPaste: (before: string, segments: string[], after: string) => void
}

function splitPastedSegments(text: string): string[] {
    return text
        .replace(/\r\n/g, '\n')
        .split('\n')
}

function resizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
}

export function SortableBlock({ index, block, isSelected, contentRef, onUpdate, onSplit, onDelete, onMergeWithPrev, onAddBelow, onTextareaFocus, onPaste }: SortableBlockProps) {
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
        <div className='flex w-full items-start gap-2'>
            <span className='w-3 pt-1 text-quaternary'>
                <Label.xs className="sm">{index + 1}</Label.xs>
            </span>
            <div className={cn('flex-1 group relative flex items-start rounded-md px-1 py-0.5 pt-1.25', 'hover:bg-tertiary', isSelected && '!bg-brand_solid/10')}>
                <div className={cn('flex absolute -left-7 items-center gap-0.5 transition-opacity', 'opacity-0 group-hover:opacity-100')}>
                    {/* <ReacstButton.Icon variant='ghost' onMouseDown={e => e.preventDefault()} onClick={onAddBelow}>
                    <Plus />
                    </ReacstButton.Icon> */}
                </div>
                <textarea
                    ref={setContentRef}
                    value={block.content}
                    rows={1}
                    spellCheck={false}
                    className="doc-block flex-1 resize-none overflow-hidden whitespace-pre-wrap bg-transparent px-0.5 py-px text-paragraph-sm text-primary outline-none placeholder:text-tertiary"
                    placeholder="Type something..."
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onChange={handleChange}
                    onFocus={onTextareaFocus}
                />
            </div>
        </div>
    )
}
