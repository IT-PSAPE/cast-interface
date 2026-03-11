export function Voicemail({ size = 16, strokeWidth = 1.33, className, filled }: { size?: number; strokeWidth?: number; className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" height={size} width={size} className={className} >
            <path d="M6 16L18 16M6 16C8.20914 16 10 14.2091 10 12C10 9.79086 8.20914 8 6 8C3.79086 8 2 9.79086 2 12C2 14.2091 3.79086 16 6 16ZM18 16C20.2091 16 22 14.2091 22 12C22 9.79086 20.2091 8 18 8C15.7909 8 14 9.79086 14 12C14 14.2091 15.7909 16 18 16Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}