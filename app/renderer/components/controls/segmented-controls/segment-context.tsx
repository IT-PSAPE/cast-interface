import { createContext, useContext } from 'react';

export type SegmentSelectionMode = 'single' | 'multiple';

interface SegmentContextValue {
  fill: boolean;
  selectionMode: SegmentSelectionMode;
  selectedValues: string[];
  onToggle: (value: string) => void;
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
