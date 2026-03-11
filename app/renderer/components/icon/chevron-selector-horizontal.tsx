export function ChevronSelectorHorizontal({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M9 7L4 12L9 17M15 7L20 12L15 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}