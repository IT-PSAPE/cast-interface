import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { Check } from 'lucide-react';

function Root({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border-secondary">
      {children}
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <div className="h-10 px-2 flex items-center text-lg font-medium">
      {children}
    </div>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 flex flex-col gap-2 pb-3">
      {children}
    </div>
  );
}

function Row({ children, lead }: { children: ReactNode; lead?: boolean }) {
  return (
    <div className={cn('grid gap-2', lead ? 'grid-cols-[1fr_repeat(2,24px)]' : 'grid-cols-[repeat(2,1fr)_24px]')}>
      {children}
    </div>
  );
}

interface CheckboxProps {
  checked?: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}

function Checkbox({ checked, className, onChange }: CheckboxProps) {
  return (
    <label className={cn('flex items-center justify-center size-4 rounded border transition-colors cursor-pointer', checked ? 'bg-brand_primary border-brand' : 'bg-secondary border-primary', className)}>
      {checked ? <Check size={14} strokeWidth={3} /> : null}
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export const Section = { Root, Header, Body, Row, Checkbox };
