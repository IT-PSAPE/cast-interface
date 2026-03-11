export function AlignLeft01({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M3 3V21M21 12H7M7 12L14 19M7 12L14 5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}