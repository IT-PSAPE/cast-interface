import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

interface SettingsSectionPartProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface SettingsSectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

function Root({ children, className, ...rest }: SettingsSectionPartProps) {
  return (
    <section className={cn('flex flex-col gap-3 border-b border-primary pb-5 last:border-b-0 last:pb-0', className)} {...rest}>
      {children}
    </section>
  );
}

function Header({ children, className, ...rest }: SettingsSectionPartProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)} {...rest}>
      {children}
    </div>
  );
}

function Title({ children, className, ...rest }: SettingsSectionTitleProps) {
  return (
    <h3 className={cn('text-sm font-semibold text-primary', className)} {...rest}>
      {children}
    </h3>
  );
}

function Action({ children, className, ...rest }: SettingsSectionPartProps) {
  return (
    <div className={cn('shrink-0', className)} {...rest}>
      {children}
    </div>
  );
}

function Body({ children, className, ...rest }: SettingsSectionPartProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} {...rest}>
      {children}
    </div>
  );
}

export const SettingsSection = { Root, Header, Title, Action, Body };
