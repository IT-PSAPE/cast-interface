export function StrokeWidth({ size = 16, className }: { size?: number; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className}>
            <line x1="4" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        </svg>
    )
}
