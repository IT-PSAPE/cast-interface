import { Children, isValidElement, type ButtonHTMLAttributes, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { RecastPanel } from '@renderer/components 2.0/panel';
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

interface PanelSectionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

interface PanelSectionPartProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

interface PanelItemProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  selected?: boolean;
  ref?: Ref<HTMLDivElement>;
}

interface PanelItemPartProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

interface SectionSlots {
  action: ReactElement<PanelSectionPartProps> | null;
  body: ReactElement<PanelSectionPartProps> | null;
  header: ReactElement<PanelSectionPartProps> | null;
  looseChildren: ReactNode[];
  title: ReactElement<PanelSectionPartProps> | null;
}

interface ItemSlots {
  body: ReactElement<PanelItemPartProps> | null;
  leading: ReactElement<PanelItemPartProps> | null;
  looseChildren: ReactNode[];
  trailing: ReactElement<PanelItemPartProps> | null;
}

const panelStyles = cv({
  base: 'flex h-full min-h-0 flex-col overflow-hidden bg-primary border-secondary',
  variants: {
    bordered: {
      left: ['border-l'],
      right: ['border-r'],
      none: [''],
    },
  },
  defaultVariants: {
    bordered: 'none',
  },
});

const itemStyles = cv({
  base: 'group relative flex w-full items-center rounded-sm border-0 px-2 py-1.5 text-left',
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
    <Component data-layer="panel" className={cn(panelStyles({ bordered }), className)} {...rest}>
      {children}
    </Component>
  );
}

const PanelHeader = RecastPanel.Header;

function PanelBody({ children, className, scroll = true, ...rest }: PanelBodyProps) {
  return (
    <div data-layer="panel-body" className={cn('min-h-0 flex-1', scroll && 'overflow-y-auto', className)} {...rest}>
      {children}
    </div>
  );
}

const PanelFooter = RecastPanel.Footer;

function Section({ children, className, ...rest }: PanelSectionProps) {
  const slots = collectSectionSlots(children);
  const bodyChildren = slots.body?.props.children ?? slots.looseChildren;
  const hasHeader = Boolean(slots.header || slots.title || slots.action);

  return (
    <section data-layer="panel-section" className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)} {...rest}>
      {hasHeader ? (
        <div className={cn('flex h-8 items-center gap-2 px-2', slots.header?.props.className)}>
          <div className={cn('min-w-0 flex-1', slots.title?.props.className)}>
            {slots.title?.props.children ?? null}
          </div>
          {slots.action ? (
            <div className={cn('shrink-0', slots.action.props.className)}>
              {slots.action.props.children}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={cn('min-h-0 flex-1', slots.body?.props.className)}>
        {bodyChildren}
      </div>
    </section>
  );
}

function SectionHeader(_props: PanelSectionPartProps) {
  return null;
}

function SectionTitle(_props: PanelSectionPartProps) {
  return null;
}

function SectionAction(_props: PanelSectionPartProps) {
  return null;
}

function SectionBody(_props: PanelSectionPartProps) {
  return null;
}

function Item({ children, className, selected, ref, ...rest }: PanelItemProps) {
  const slots = collectItemSlots(children);
  const content = slots.body?.props.children ?? slots.looseChildren;

  return (
    <div ref={ref} className={itemStyles({ selected, className })} data-layer="panel-item" {...rest}>
      {slots.leading ? (
        <span className={cn('mr-2 shrink-0 text-tertiary', slots.leading.props.className)}>
          {slots.leading.props.children}
        </span>
      ) : null}
      {content}
      {slots.trailing ? (
        <span className={cn('ml-2 shrink-0', slots.trailing.props.className)}>
          {slots.trailing.props.children}
        </span>
      ) : null}
    </div>
  );
}

function ItemLeading(_props: PanelItemPartProps) {
  return null;
}

function ItemBody(_props: PanelItemPartProps) {
  return null;
}

function ItemTrailing(_props: PanelItemPartProps) {
  return null;
}

type PanelItemButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type PanelItemActionsProps = HTMLAttributes<HTMLDivElement>;

function PanelItemButton({ className, ...props }: PanelItemButtonProps) {
  return <button className={cn('flex w-full items-center gap-2 text-left', className)} {...props} />;
}

function PanelItemActions({ className, ...props }: PanelItemActionsProps) {
  return (
    <div
      className={cn('absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100', className)}
      {...props}
    />
  );
}

function collectSectionSlots(children: ReactNode): SectionSlots {
  const slots: SectionSlots = {
    action: null,
    body: null,
    header: null,
    looseChildren: [],
    title: null,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement<PanelSectionPartProps>(child)) {
      slots.looseChildren.push(child);
      return;
    }

    if (child.type === SectionHeader) {
      slots.header = child as ReactElement<PanelSectionPartProps>;
      const headerSlots = collectSectionHeaderSlots(child.props.children);
      slots.title = headerSlots.title;
      slots.action = headerSlots.action;
      slots.looseChildren.push(...headerSlots.looseChildren);
      return;
    }
    if (child.type === SectionTitle) {
      slots.title = child as ReactElement<PanelSectionPartProps>;
      return;
    }
    if (child.type === SectionAction) {
      slots.action = child as ReactElement<PanelSectionPartProps>;
      return;
    }
    if (child.type === SectionBody) {
      slots.body = child as ReactElement<PanelSectionPartProps>;
      return;
    }

    slots.looseChildren.push(child);
  });

  return slots;
}

function collectSectionHeaderSlots(children: ReactNode) {
  const slots: { action: ReactElement<PanelSectionPartProps> | null; looseChildren: ReactNode[]; title: ReactElement<PanelSectionPartProps> | null } = {
    action: null,
    looseChildren: [],
    title: null,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      slots.looseChildren.push(child);
      return;
    }
    if (child.type === SectionTitle) {
      slots.title = child as ReactElement<PanelSectionPartProps>;
      return;
    }
    if (child.type === SectionAction) {
      slots.action = child as ReactElement<PanelSectionPartProps>;
      return;
    }
    slots.looseChildren.push(child);
  });

  return slots;
}

function collectItemSlots(children: ReactNode): ItemSlots {
  const slots: ItemSlots = { body: null, leading: null, looseChildren: [], trailing: null };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      slots.looseChildren.push(child);
      return;
    }
    if (child.type === ItemLeading) {
      slots.leading = child as ReactElement<PanelItemPartProps>;
      return;
    }
    if (child.type === ItemBody) {
      slots.body = child as ReactElement<PanelItemPartProps>;
      return;
    }
    if (child.type === ItemTrailing) {
      slots.trailing = child as ReactElement<PanelItemPartProps>;
      return;
    }
    slots.looseChildren.push(child);
  });

  return slots;
}

export const Panel = Object.assign(Root, {
  Header: PanelHeader,
  Content: RecastPanel.Content,
  Body: PanelBody,
  Footer: PanelFooter,
  Group: RecastPanel.Group,
  GroupTitle: RecastPanel.GroupTitle,
  GroupContent: RecastPanel.GroupContent,
  MenuItem: RecastPanel.MenuItem,
  Section,
  SectionHeader,
  SectionTitle,
  SectionAction,
  SectionBody,
  Item,
  ItemLeading,
  ItemBody,
  ItemTrailing,
  ItemButton: PanelItemButton,
  ItemActions: PanelItemActions,
});
