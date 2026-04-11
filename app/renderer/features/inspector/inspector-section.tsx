import type { ReactNode } from 'react';
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
        {checked ? <CheckboxMark /> : null}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

function CheckboxMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="stroke-current">
      <path d="M5 13l4 4L19 7" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Section = { Root, Header, Body, Row, Checkbox: CheckboxControl };
