import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import type { NdiOutputState } from '@core/types';

interface NdiContextValue {
  outputState: NdiOutputState;
  toggleAudienceOutput: () => void;
}

const NdiContext = createContext<NdiContextValue | null>(null);

export function NdiProvider({ children }: { children: ReactNode }) {
  const [outputState, setOutputState] = useState<NdiOutputState>({ audience: false });
  const outputStateRef = useRef(outputState);
  outputStateRef.current = outputState;

  useEffect(() => {
    void window.castApi.getNdiOutputState().then(setOutputState).catch((error) => {
      console.error('[NdiProvider] Failed to get output state:', error);
    });
    const unsub = window.castApi.onNdiOutputStateChanged(setOutputState);
    return unsub;
  }, []);

  const toggleAudienceOutput = useCallback(() => {
    void window.castApi
      .setNdiOutputEnabled('audience', !outputStateRef.current.audience)
      .then(setOutputState)
      .catch((error) => {
        console.error('[NdiProvider] Failed to toggle output:', error);
      });
  }, []);

  const value = useMemo(() => ({ outputState, toggleAudienceOutput }), [outputState, toggleAudienceOutput]);

  return <NdiContext.Provider value={value}>{children}</NdiContext.Provider>;
}

export function useNdi(): NdiContextValue {
  const ctx = useContext(NdiContext);
  if (!ctx) throw new Error('useNdi must be used within NdiProvider');
  return ctx;
}
