import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDefaultNdiOutputConfigs } from '@core/ndi';
import type { AppSnapshot, NdiDiagnostics, NdiOutputConfig, NdiOutputConfigMap, NdiOutputName, NdiOutputState } from '@core/types';
import { applyPatch, type SnapshotPatch } from '@core/snapshot-patch';
import type { ThemeMode } from '../types/ui';
import { useLocalStorage } from '../hooks/use-local-storage';

// ─── Types ──────────────────────────────────────────────────────────

interface AppContextValue {
  state: {
    snapshot: AppSnapshot | null;
    isRunningOperation: boolean;
    operationText: string | null;
    statusText: string;
    themeMode: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    ndiDiagnostics: NdiDiagnostics | null;
    ndiOutputConfigs: NdiOutputConfigMap;
    ndiOutputState: NdiOutputState;
  };
  actions: {
    mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
    mutatePatch: (action: () => Promise<SnapshotPatch>) => Promise<AppSnapshot>;
    runOperation: <T>(text: string, action: () => Promise<T>) => Promise<T>;
    setStatusText: (text: string) => void;
    setThemeMode: (mode: ThemeMode) => void;
    setNdiOutputEnabled: (name: NdiOutputName, enabled: boolean) => void;
    toggleAudienceOutput: () => void;
    updateNdiOutputConfig: (name: NdiOutputName, config: Partial<NdiOutputConfig>) => void;
  };
}

// ─── Convenience slice types ────────────────────────────────────────

interface CastSlice {
  snapshot: AppSnapshot | null;
  isRunningOperation: boolean;
  operationText: string | null;
  statusText: string;
  mutate: (action: () => Promise<AppSnapshot>) => Promise<AppSnapshot>;
  mutatePatch: (action: () => Promise<SnapshotPatch>) => Promise<AppSnapshot>;
  runOperation: <T>(text: string, action: () => Promise<T>) => Promise<T>;
  setStatusText: (text: string) => void;
}

interface ThemeSlice {
  state: { themeMode: ThemeMode; resolvedTheme: 'light' | 'dark' };
  actions: { setThemeMode: (mode: ThemeMode) => void };
}

interface NdiSlice {
  state: { diagnostics: NdiDiagnostics | null; outputConfigs: NdiOutputConfigMap; outputState: NdiOutputState };
  actions: {
    setOutputEnabled: (name: NdiOutputName, enabled: boolean) => void;
    toggleAudienceOutput: () => void;
    updateOutputConfig: (name: NdiOutputName, config: Partial<NdiOutputConfig>) => void;
  };
}

// ─── Constants ──────────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'cast-theme-mode';
const VALID_THEME_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);

function parseThemeMode(raw: string): ThemeMode | null {
  return VALID_THEME_MODES.has(raw as ThemeMode) ? (raw as ThemeMode) : null;
}

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ─── Context ────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Snapshot & mutation queue ──
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [isRunningOperation, setIsRunningOperation] = useState(false);
  const [operationText, setOperationText] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Ready');
  const mutateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const operationDepthRef = useRef(0);
  // Mirrors the `snapshot` React state synchronously so `mutatePatch` can
  // apply a patch to the post-state and return the up-to-date AppSnapshot
  // to its caller without waiting for the React commit.
  const snapshotRef = useRef<AppSnapshot | null>(null);
  const setSnapshotBoth = useCallback((value: AppSnapshot) => {
    snapshotRef.current = value;
    setSnapshot(value);
  }, []);

  useEffect(() => {
    void window.castApi.getSnapshot().then((loaded) => {
      snapshotRef.current = loaded;
      setSnapshot(loaded);
    }).catch((error) => {
      console.error('[AppProvider] Failed to load snapshot:', error);
      setStatusText('Failed to load data');
    });
  }, []);

  const mutate = useCallback((action: () => Promise<AppSnapshot>) => {
    const run = async () => {
      try {
        const next = await action();
        setSnapshotBoth(next);
        return next;
      } catch (error) {
        console.error('[AppProvider] Mutation failed:', error);
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
  }, [setSnapshotBoth]);

  // Like `mutate` but the action returns a `SnapshotPatch` instead of a
  // full AppSnapshot. Applies the patch to the current snapshot and
  // returns the updated AppSnapshot so existing callers that do
  // `const next = await mutate(() => castApi.fooAction())` keep working.
  const mutatePatch = useCallback((action: () => Promise<SnapshotPatch>) => {
    const run = async (): Promise<AppSnapshot> => {
      try {
        const patch = await action();
        const prev = snapshotRef.current;
        if (!prev) throw new Error('Snapshot not loaded before mutatePatch call');
        const next = applyPatch(prev, patch);
        setSnapshotBoth(next);
        return next;
      } catch (error) {
        console.error('[AppProvider] Patch mutation failed:', error);
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
  }, [setSnapshotBoth]);

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

  // ── Theme ──
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>(THEME_STORAGE_KEY, 'dark', parseThemeMode);
  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPreference);
  const resolvedTheme = themeMode === 'system' ? systemPref : themeMode;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e: MediaQueryListEvent) {
      setSystemPref(e.matches ? 'dark' : 'light');
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // ── NDI ──
  const [ndiDiagnostics, setNdiDiagnostics] = useState<NdiDiagnostics | null>(null);
  const [ndiOutputConfigs, setNdiOutputConfigs] = useState<NdiOutputConfigMap>(createDefaultNdiOutputConfigs);
  const [ndiOutputState, setNdiOutputState] = useState<NdiOutputState>({ audience: false });
  const ndiOutputStateRef = useRef(ndiOutputState);
  ndiOutputStateRef.current = ndiOutputState;

  useEffect(() => {
    void window.castApi.getNdiDiagnostics().then(setNdiDiagnostics).catch((error) => {
      console.error('[AppProvider] Failed to get NDI diagnostics:', error);
    });
    void window.castApi.getNdiOutputConfigs().then(setNdiOutputConfigs).catch((error) => {
      console.error('[AppProvider] Failed to get output config:', error);
    });
    void window.castApi.getNdiOutputState().then(setNdiOutputState).catch((error) => {
      console.error('[AppProvider] Failed to get output state:', error);
    });

    const unsubscribeOutput = window.castApi.onNdiOutputStateChanged(setNdiOutputState);
    const unsubscribeDiagnostics = window.castApi.onNdiDiagnosticsChanged(setNdiDiagnostics);
    return () => {
      unsubscribeOutput();
      unsubscribeDiagnostics();
    };
  }, []);

  const setNdiOutputEnabled = useCallback((name: NdiOutputName, enabled: boolean) => {
    void window.castApi.setNdiOutputEnabled(name, enabled).then(setNdiOutputState).catch((error) => {
      console.error('[AppProvider] Failed to update output state:', error);
    });
  }, []);

  const toggleAudienceOutput = useCallback(() => {
    setNdiOutputEnabled('audience', !ndiOutputStateRef.current.audience);
  }, [setNdiOutputEnabled]);

  const updateNdiOutputConfig = useCallback((name: NdiOutputName, config: Partial<NdiOutputConfig>) => {
    void window.castApi.updateNdiOutputConfig(name, config).then(setNdiOutputConfigs).catch((error) => {
      console.error('[AppProvider] Failed to update output config:', error);
    });
  }, []);

  // ── Context value ──
  const state = useMemo<AppContextValue['state']>(() => ({
    snapshot,
    isRunningOperation,
    operationText,
    statusText,
    themeMode,
    resolvedTheme,
    ndiDiagnostics,
    ndiOutputConfigs,
    ndiOutputState,
  }), [snapshot, isRunningOperation, operationText, statusText, themeMode, resolvedTheme, ndiDiagnostics, ndiOutputConfigs, ndiOutputState]);

  const actions = useMemo<AppContextValue['actions']>(() => ({
    mutate,
    mutatePatch,
    runOperation,
    setStatusText,
    setThemeMode,
    setNdiOutputEnabled,
    toggleAudienceOutput,
    updateNdiOutputConfig,
  }), [mutate, mutatePatch, runOperation, setThemeMode, setNdiOutputEnabled, toggleAudienceOutput, updateNdiOutputConfig]);

  const value = useMemo<AppContextValue>(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useCast(): CastSlice {
  const { state, actions } = useApp();
  return {
    snapshot: state.snapshot,
    isRunningOperation: state.isRunningOperation,
    operationText: state.operationText,
    statusText: state.statusText,
    mutate: actions.mutate,
    mutatePatch: actions.mutatePatch,
    runOperation: actions.runOperation,
    setStatusText: actions.setStatusText,
  };
}

export function useTheme(): ThemeSlice {
  const { state, actions } = useApp();
  return {
    state: { themeMode: state.themeMode, resolvedTheme: state.resolvedTheme },
    actions: { setThemeMode: actions.setThemeMode },
  };
}

export function useNdi(): NdiSlice {
  const { state, actions } = useApp();
  return {
    state: { diagnostics: state.ndiDiagnostics, outputConfigs: state.ndiOutputConfigs, outputState: state.ndiOutputState },
    actions: {
      setOutputEnabled: actions.setNdiOutputEnabled,
      toggleAudienceOutput: actions.toggleAudienceOutput,
      updateOutputConfig: actions.updateNdiOutputConfig,
    },
  };
}
