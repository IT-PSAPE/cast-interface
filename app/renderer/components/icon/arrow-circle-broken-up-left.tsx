export function ArrowCircleBrokenUpLeft({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M14.5896 21.6606C11.2534 22.5515 7.54623 21.6883 4.92893 19.071C1.02369 15.1658 1.02369 8.83412 4.92893 4.92887C8.83418 1.02363 15.1658 1.02363 19.0711 4.92887C21.6884 7.54616 22.5515 11.2533 21.6606 14.5895M9.00023 15V9.00004M9.00023 9.00004H15.0002M9.00023 9.00004L19 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}