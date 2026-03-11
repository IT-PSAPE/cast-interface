import { createContext, useContext } from 'react';

interface SegmentContextValue {
  fill: boolean;
  selectedValue: string | null;
  onSelect: (value: string) => void;
}

const SegmentContext = createContext<SegmentContextValue | null>(null);

export function useSegment() {
  const context = useContext(SegmentContext);
  if (!context) {
    throw new Error('useSegment must be used within SegmentedControl.Root');
  }
  return context;
}

export { SegmentContext };
