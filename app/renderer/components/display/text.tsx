import { cn } from "@renderer/utils/cn"
import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from "react"

type TitleH1Props = ComponentPropsWithoutRef<"h1">
type TitleH2Props = ComponentPropsWithoutRef<"h2">
type TitleH3Props = ComponentPropsWithoutRef<"h3">
type TitleH4Props = ComponentPropsWithoutRef<"h4">
type TitleH5Props = ComponentPropsWithoutRef<"h5">
type TitleH6Props = ComponentPropsWithoutRef<"h6">

type ParagraphProps = {
    children?: ReactNode
    className?: string
}

type LabelProps = {
    children?: ReactNode
    className?: string
}

function TitleH1({ children, className, ...props }: TitleH1Props) {
    return (
        <h1 className={cn("title-h1", className)} {...props}>{children}</h1>
    )
}

function TitleH2({ children, className, ...props }: TitleH2Props) {
    return (
        <h2 className={cn("title-h2", className)} {...props}>{children}</h2>
    )
}

function TitleH3({ children, className, ...props }: TitleH3Props) {
    return (
        <h3 className={cn("title-h3", className)} {...props}>{children}</h3>
    )
}

function TitleH4({ children, className, ...props }: TitleH4Props) {
    return (
        <h4 className={cn("title-h4", className)} {...props}>{children}</h4>
    )
}

function TitleH5({ children, className, ...props }: TitleH5Props) {
    return (
        <h5 className={cn("title-h5", className)} {...props}>{children}</h5>
    )
}

function TitleH6({ children, className, ...props }: TitleH6Props) {
    return (
        <h6 className={cn("title-h6", className)} {...props}>{children}</h6>
    )
}

function ParagraphLg({ children, className }: ParagraphProps) {
    return (
        <p className={cn("paragraph-lg", className)}>{children}</p>
    )
}

function ParagraphBg({ children, className }: ParagraphProps) {
    return (
        <p className={cn("paragraph-bg", className)}>{children}</p>
    )
}

function ParagraphMd({ children, className }: ParagraphProps) {
    return (
        <p className={cn("paragraph-md", className)}>{children}</p>
    )
}

function ParagraphSm({ children, className }: ParagraphProps) {
    return (
        <p className={cn("paragraph-sm", className)}>{children}</p>
    )
}

function ParagraphXs({ children, className }: ParagraphProps) {
    return (
        <p className={cn("paragraph-xs", className)}>{children}</p>
    )
}

function LabelLg({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn("label-lg", className)} {...props}>{children}</span>
    )
}

function LabelBg({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn("label-bg", className)} {...props}>{children}</span>
    )
}

function LabelMd({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn("label-md", className)} {...props}>{children}</span>
    )
}

function LabelSm({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn("label-sm", className)} {...props}>{children}</span>
    )
}

function LabelXs({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn("label-xs", className)} {...props}>{children}</span>
    )
}

export function TextBlock({ children, className }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn(className)}>{children}</span>
    )
}

export const Title = {
    h1: TitleH1,
    h2: TitleH2,
    h3: TitleH3,
    h4: TitleH4,
    h5: TitleH5,
    h6: TitleH6,
}

export const Paragraph = {
    lg: ParagraphLg,
    bg: ParagraphBg,
    md: ParagraphMd,
    sm: ParagraphSm,
    xs: ParagraphXs,
}

export const Label = {
    lg: LabelLg,
    bg: LabelBg,
    md: LabelMd,
    sm: LabelSm,
    xs: LabelXs,
}
