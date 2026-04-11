import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

type PanelElement = 'div' | 'aside' | 'section';

interface PanelRootProps extends HTMLAttributes<HTMLElement> {
  as?: PanelElement;
  bordered?: 'left' | 'right' | 'none';
}

const panelStyles = cv({
  base: 'flex h-full min-h-0 flex-col overflow-hidden',
  variants: {
    bordered: {
      left: ['border-l border-border-primary bg-primary'],
      right: ['border-r border-border-primary bg-primary'],
      none: [''],
    },
  },
  defaultVariants: {
    bordered: 'none',
  },
});

function Root({ children, className, as: Component = 'div', bordered = 'none', ...rest }: PanelRootProps) {
  return (
    <Component
      data-layer="panel"
      className={cn(panelStyles({ bordered }), className,)}
      {...rest}
    >
      {children}
    </Component>
  );
}

function PanelHeader({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-layer="panel-header" className={cn('flex items-center px-2 py-1.5 border-b border-border-primary', className)} {...rest}>
      {children}
    </div>
  );
}

interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  scroll?: boolean;
}

function PanelBody({ children, className, scroll = true, ...rest }: PanelBodyProps) {
  return (
    <div data-layer="panel-body" className={cn('min-h-0 flex-1', scroll && 'overflow-y-auto', className)} {...rest}>
      {children}
    </div>
  );
}

function PanelFooter({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-layer="panel-footer" className={cn('border-t border-border-primary', className)} {...rest}>
      {children}
    </div>
  );
}

interface PanelSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
}

function PanelSection({ children, className, title, action, headerClassName, bodyClassName, ...rest }: PanelSectionProps) {
  if (!title) {
    return (
      <div data-layer="panel-section" className={cn('', className)} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <section data-layer="panel-section" className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)} {...rest}>
      <header className={cn('flex h-8 items-center gap-2 px-2', headerClassName)}>
        <div className="min-w-0 flex-1">{title}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn('min-h-0 flex-1', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

const itemStyles = cv({
  base: 'flex items-center w-full rounded-sm border-0 px-2 py-1.5 text-left cursor-pointer',
  variants: {
    selected: {
      true: ['bg-background-active text-text-primary'],
      false: ['hover:bg-background-quaternary/50 hover:text-text-primary'],
    },
  },
  defaultVariants: {
    selected: false,
  },
});

interface PanelItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
}

function PanelItem({ children, className, leading, trailing, selected, type = 'button', ...rest }: PanelItemProps) {
  return (
    <button type={type} className={itemStyles({ selected, className })} data-layer="panel-item" {...rest}>
      {leading ? <span className="shrink-0 text-text-tertiary mr-2">{leading}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing ? <span className="shrink-0 ml-2">{trailing}</span> : null}
    </button>
  );
}

export const Panel = { Root, Header: PanelHeader, Body: PanelBody, Footer: PanelFooter, Section: PanelSection, Item: PanelItem };
