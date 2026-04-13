import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

type PanelElement = 'div' | 'aside' | 'section';

interface PanelRootProps extends HTMLAttributes<HTMLElement> {
  as?: PanelElement;
  bordered?: 'left' | 'right' | 'none';
}

interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  scroll?: boolean;
}

interface PanelItemProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
}

interface PanelSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
}

const panelStyles = cv({
  base: 'flex h-full min-h-0 flex-col overflow-hidden',
  variants: {
    bordered: {
      left: ['border-l border-primary bg-primary'],
      right: ['border-r border-primary bg-primary'],
      none: [''],
    },
  },
  defaultVariants: {
    bordered: 'none',
  },
});

const itemStyles = cv({
  base: 'group relative flex items-center w-full rounded-sm border-0 px-2 py-1.5 text-left cursor-pointer',
  variants: {
    selected: {
      true: ['bg-active text-primary'],
      false: ['hover:bg-quaternary/50 hover:text-primary'],
    },
  },
  defaultVariants: {
    selected: false,
  },
});

function Root({ children, className, as: Component = 'div', bordered = 'none', ...rest }: PanelRootProps) {
  return (
    <Component data-layer="panel" className={cn(panelStyles({ bordered }), className,)} {...rest} >
      {children}
    </Component>
  );
}

function PanelHeader({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-layer="panel-header" className={cn('h-8 flex items-center px-2 py-0.5 border-b border-primary', className)} {...rest}>
      {children}
    </div>
  );
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
    <div data-layer="panel-footer" className={cn('border-t border-primary', className)} {...rest}>
      {children}
    </div>
  );
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

function PanelItem({ children, className, leading, trailing, selected, ...rest }: PanelItemProps) {
  return (
    <div className={itemStyles({ selected, className })} data-layer="panel-item" {...rest}>
      {leading ? <span className="shrink-0 text-tertiary mr-2">{leading}</span> : null}
      {children}
      {trailing ? <span className="shrink-0 ml-2">{trailing}</span> : null}
    </div>
  );
}


type PanelItemButtonProps = HTMLAttributes<HTMLButtonElement>;

type PanelItemActionsProps = HTMLAttributes<HTMLDivElement>;

function PanelItemButton({ className, ...props }: PanelItemButtonProps) {
  return <button className={cn('w-full flex items-center gap-2 text-left', className)} {...props} />
}

function PanelItemActions({ className, ...props }: PanelItemActionsProps){
  return <div className={cn('absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100', className)} {...props} />
}

export const Panel = Object.assign(Root, {
  Header: PanelHeader,
  Body: PanelBody,
  Footer: PanelFooter,
  Section: PanelSection,
  Item: PanelItem,
  ItemButton: PanelItemButton,
  ItemActions: PanelItemActions,
});