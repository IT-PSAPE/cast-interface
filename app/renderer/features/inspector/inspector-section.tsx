import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Checkbox } from '@renderer/components/form/checkbox';
import { cv } from '@renderer/utils/cv';

function Root({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-secondary">
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

const rowStyles = cv({
  base: 'grid gap-2',
  variants: {
    lead: {
      true: ['grid-cols-[1fr_repeat(2,24px)]'],
      false: ['grid-cols-[repeat(2,1fr)_24px]'],
    },
  },
  defaultVariants: {
    lead: false,
  },
});

function Row({ children, lead }: { children: ReactNode; lead?: boolean }) {
  return (
    <div className={rowStyles({ lead })}>
      {children}
    </div>
  );
}

interface CheckboxProps {
  checked?: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}

function CheckboxControl({ checked, className, onChange }: CheckboxProps) {
  return (
    <Checkbox.Root checked={checked} onCheckedChange={onChange} className={className}>
      <Checkbox.Indicator className="size-4">
        {checked ? <Check size={14} strokeWidth={3} aria-hidden="true" />: null}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
export const Section = { Root, Header, Body, Row, Checkbox: CheckboxControl };
