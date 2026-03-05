import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import type { NdiOutputName, NdiOutputState } from '@core/types';

interface NdiContextValue {
  outputState: NdiOutputState;
  toggleOutput: (name: NdiOutputName) => void;
}

const NdiContext = createContext<NdiContextValue | null>(null);

export function NdiProvider({ children }: { children: ReactNode }) {
  const [outputState, setOutputState] = useState<NdiOutputState>({ audience: false, stage: false });
  const outputStateRef = useRef(outputState);
  outputStateRef.current = outputState;

  useEffect(() => {
    void window.castApi.getNdiOutputState().then(setOutputState).catch((error) => {
      console.error('[NdiProvider] Failed to get output state:', error);
    });
    const unsub = window.castApi.onNdiOutputStateChanged(setOutputState);
    return unsub;
  }, []);

  const toggleOutput = useCallback((name: NdiOutputName) => {
    void window.castApi
      .setNdiOutputEnabled(name, !outputStateRef.current[name])
      .then(setOutputState)
      .catch((error) => {
        console.error('[NdiProvider] Failed to toggle output:', error);
      });
  }, []);

  const value = useMemo(() => ({ outputState, toggleOutput }), [outputState, toggleOutput]);

  return <NdiContext.Provider value={value}>{children}</NdiContext.Provider>;
}

export function useNdi(): NdiContextValue {
  const ctx = useContext(NdiContext);
  if (!ctx) throw new Error('useNdi must be used within NdiProvider');
  return ctx;
}
