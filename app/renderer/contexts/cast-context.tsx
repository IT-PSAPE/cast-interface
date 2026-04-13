import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { AppSnapshot } from '@core/types';

interface CastContextValue {
  snapshot: AppSnapshot | null;
  isRunningOperation: boolean;
  operationText: string | null;
  statusText: string;
  setStatusText: (text: string) => void;
  mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
  runOperation: <T>(text: string, action: () => Promise<T>) => Promise<T>;
}

const CastContext = createContext<CastContextValue | null>(null);

export function CastProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [isRunningOperation, setIsRunningOperation] = useState(false);
  const [operationText, setOperationText] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Ready');
  const mutateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const operationDepthRef = useRef(0);

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

  const runOperation = useCallback(async <T,>(text: string, action: () => Promise<T>) => {
    operationDepthRef.current += 1;
    setOperationText(text);
    setIsRunningOperation(true);

    try {
      return await action();
    } finally {
      operationDepthRef.current = Math.max(0, operationDepthRef.current - 1);
      if (operationDepthRef.current === 0) {
        setIsRunningOperation(false);
        setOperationText(null);
      }
    }
  }, []);

  const value = useMemo<CastContextValue>(
    () => ({ snapshot, isRunningOperation, operationText, statusText, setStatusText, mutate, runOperation }),
    [snapshot, isRunningOperation, operationText, statusText, mutate, runOperation],
  );

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast(): CastContextValue {
  const ctx = useContext(CastContext);
  if (!ctx) throw new Error('useCast must be used within CastProvider');
  return ctx;
}
