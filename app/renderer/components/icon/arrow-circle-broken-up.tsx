export function ArrowCircleBrokenUp({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M7 20.6621C4.01099 18.9331 2 15.7013 2 11.9999C2 6.47709 6.47715 1.99994 12 1.99994C17.5228 1.99994 22 6.47709 22 11.9999C22 15.7014 19.989 18.9331 17 20.6621M16 12L12 8.00001M12 8.00001L8 12M12 8.00001V22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}