import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { cn } from '@renderer/utils/cn'

const VIEWPORT_PADDING = 8

function getOverlayRoot(): HTMLElement {
    return document.getElementById('overlay-root') ?? document.body
}

type BlockMenuProps = {
    x: number
    y: number
    onAction: (action: string) => void
    onClose: () => void
}

export function BlockMenu({ x, y, onAction, onClose }: BlockMenuProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [clampedPos, setClampedPos] = useState({ left: x, top: y })

    useLayoutEffect(() => {
        if (!ref.current) { setClampedPos({ left: x, top: y }); return }
        const rect = ref.current.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        setClampedPos({
            left: x + rect.width > vw - VIEWPORT_PADDING ? Math.max(VIEWPORT_PADDING, vw - rect.width - VIEWPORT_PADDING) : x,
            top: y + rect.height > vh - VIEWPORT_PADDING ? Math.max(VIEWPORT_PADDING, vh - rect.height - VIEWPORT_PADDING) : y,
        })
    }, [x, y])

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (!ref.current) return
            if (ref.current.contains(event.target as Node)) return
            onClose()
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose()
        }
        const t = window.setTimeout(() => {
            window.addEventListener('mousedown', handlePointerDown)
            window.addEventListener('contextmenu', handlePointerDown)
            window.addEventListener('keydown', handleEscape)
        }, 0)
        return () => {
            window.clearTimeout(t)
            window.removeEventListener('mousedown', handlePointerDown)
            window.removeEventListener('contextmenu', handlePointerDown)
            window.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    const items = [
        { id: 'delete', icon: <Trash2 size={14} />, label: 'Delete', danger: true },
        { id: 'duplicate', icon: <Copy size={14} />, label: 'Duplicate' },
        { id: 'sep' },
        { id: 'move-up', icon: <ArrowUp size={14} />, label: 'Move Up' },
        { id: 'move-down', icon: <ArrowDown size={14} />, label: 'Move Down' },
    ]

    return createPortal(
        <div
            ref={ref}
            className="pointer-events-auto fixed z-50 flex min-w-48 flex-col overflow-hidden rounded-md border border-secondary bg-primary p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
            style={{ left: clampedPos.left, top: clampedPos.top }}
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
        </div>,
        getOverlayRoot(),
    )
}
