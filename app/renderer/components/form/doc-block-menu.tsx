import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { cn } from '@renderer/utils/cn'

type BlockMenuProps = {
    onAction: (action: string) => void
    onClose: () => void
}

export function BlockMenu({ onAction, onClose }: BlockMenuProps) {
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
        { id: 'delete', icon: <Trash2 size={14} />, label: 'Delete block', danger: true },
        { id: 'duplicate', icon: <Copy size={14} />, label: 'Duplicate' },
        { id: 'sep' },
        { id: 'move-top', icon: <ArrowUp size={14} />, label: 'Move to top' },
        { id: 'move-bottom', icon: <ArrowDown size={14} />, label: 'Move to bottom' },
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
