export function ArrowDown({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}