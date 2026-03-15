export function LetterX({ size = 16, strokeWidth = 1.67, className }: { size?: number; strokeWidth?: number; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className}>
            <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}
