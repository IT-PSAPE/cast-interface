import { createContext, useContext } from 'react';

export type SectionHeaderDensity = 'comfortable' | 'compact';

interface SectionHeaderContextValue {
  state: {};
  actions: {};
  meta: {
    density: SectionHeaderDensity;
  };
}

export const SectionHeaderContext = createContext<SectionHeaderContextValue | null>(null);

export function useSectionHeaderContext(): SectionHeaderContextValue {
  const context = useContext(SectionHeaderContext);
  if (!context) throw new Error('SectionHeader components must be used within SectionHeader.Root');
  return context;
}
