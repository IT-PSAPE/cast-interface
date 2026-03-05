import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { AppSnapshot } from '@core/types';

interface CastContextValue {
  snapshot: AppSnapshot | null;
  statusText: string;
  setStatusText: (text: string) => void;
  mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
}

const CastContext = createContext<CastContextValue | null>(null);

export function CastProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [statusText, setStatusText] = useState('Ready');
  const mutateQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    void window.castApi.getSnapshot().then(setSnapshot).catch((error) => {
      console.error('[CastProvider] Failed to load snapshot:', error);
      setStatusText('Failed to load data');
    });
  }, []);

  const mutate = useCallback((action: () => Promise<AppSnapshot>) => {
    const run = async () => {
      try {
        const next = await action();
        setSnapshot(next);
        return next;
      } catch (error) {
        console.error('[CastProvider] Mutation failed:', error);
        setStatusText('Operation failed');
        throw error;
      }
    };
    const queued = mutateQueueRef.current.then(run, run);
    mutateQueueRef.current = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued;
  }, []);

  const value = useMemo<CastContextValue>(
    () => ({ snapshot, statusText, setStatusText, mutate }),
    [snapshot, statusText, mutate],
  );

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast(): CastContextValue {
  const ctx = useContext(CastContext);
  if (!ctx) throw new Error('useCast must be used within CastProvider');
  return ctx;
}
