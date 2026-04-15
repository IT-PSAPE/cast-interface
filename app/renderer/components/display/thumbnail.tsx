import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const thumbnailStyles = cv({
    base: 'group relative w-full min-w-0 overflow-hidden rounded-xs border bg-primary text-left transition-colors',
    variants: {
        selected: {
            true: ['border-brand-400/70 ring-1 ring-brand-400/35'],
            false: ['border-primary hover:border-secondary'],
        },
    },
    defaultVariants: {
        selected: false,
    },
});

interface ThumbnailRowProps {
    preview: ReactNode;
    body: ReactNode;
    className?: string;
    previewClassName?: string;
    bodyClassName?: string;
    overlay?: ReactNode;
    onClick?: () => void;
    onDoubleClick?: () => void;
    selected?: boolean;
}

interface ThumbnailTileProps {
    body: ReactNode;
    caption: ReactNode;
    className?: string;
    captionClassName?: string;
    bodyClassName?: string;
    overlay?: ReactNode;
    onClick?: () => void;
    onDoubleClick?: () => void;
    selected?: boolean;
}

function Row({ preview, body, className, previewClassName, bodyClassName, overlay, onClick, onDoubleClick, selected = false }: ThumbnailRowProps) {
    return (
        <div onClick={onClick} onDoubleClick={onDoubleClick} className={cn(thumbnailStyles({ selected }), 'flex', className)}>
            <div className={cn('relative min-w-0 overflow-hidden border-r border-primary bg-tertiary max-w-3xs flex-1', previewClassName)}>
                {preview}
            </div>
            <div className={cn('grid min-h-[84px] min-w-0 content-center gap-1 px-2.5 py-2', bodyClassName)}>
                {body}
            </div>
            {overlay}
        </div>
    );
}

function Tile({ body, caption, className, bodyClassName, captionClassName, overlay, onClick, onDoubleClick, selected = false }: ThumbnailTileProps) {
    return (
        <div onClick={onClick} onDoubleClick={onDoubleClick} className={cn(thumbnailStyles({ selected }), className)}>
            <div className={cn('relative aspect-video min-w-0 overflow-hidden bg-primary', bodyClassName)}>{body}</div>
            {overlay}
            <div className={cn('min-w-0 truncate border-t border-primary bg-tertiary px-2 py-1 text-sm text-secondary transition-colors group-hover:text-primary', captionClassName)}>
                {caption}
            </div>
        </div>
    );
}

export const Thumbnail = { Row, Tile };
