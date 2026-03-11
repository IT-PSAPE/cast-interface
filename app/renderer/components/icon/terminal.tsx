export function Terminal({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M4 17L10 11L4 5M12 19H20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}