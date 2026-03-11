export function XClose({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}