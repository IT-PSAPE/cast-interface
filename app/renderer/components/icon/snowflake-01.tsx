export function Snowflake01({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M18.0622 8.5L5.9378 15.5M18.0622 8.5L19.1602 4.40192M18.0622 8.5L22.1602 9.59808M5.9378 15.5L1.83972 14.4019M5.9378 15.5L4.83972 19.5981M18.0621 15.4999L5.93771 8.49986M18.0621 15.4999L22.1602 14.4018M18.0621 15.4999L19.1602 19.598M5.93771 8.49986L4.83986 4.40203M5.93771 8.49986L1.83986 9.59819M12 5L12 19M12 5L8.99998 2M12 5L15 2M12 19L8.99998 22M12 19L15 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}