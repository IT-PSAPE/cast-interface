import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDefaultNdiOutputConfigs } from '@core/ndi';
import type { NdiDiagnostics, NdiOutputConfig, NdiOutputConfigMap, NdiOutputName, NdiOutputState } from '@core/types';

interface NdiContextValue {
  diagnostics: NdiDiagnostics | null;
  outputConfigs: NdiOutputConfigMap;
  outputState: NdiOutputState;
  setOutputEnabled: (name: NdiOutputName, enabled: boolean) => void;
  toggleAudienceOutput: () => void;
  updateOutputConfig: (name: NdiOutputName, config: Partial<NdiOutputConfig>) => void;
}

const NdiContext = createContext<NdiContextValue | null>(null);

export function NdiProvider({ children }: { children: ReactNode }) {
  const [diagnostics, setDiagnostics] = useState<NdiDiagnostics | null>(null);
  const [outputConfigs, setOutputConfigs] = useState<NdiOutputConfigMap>(createDefaultNdiOutputConfigs);
  const [outputState, setOutputState] = useState<NdiOutputState>({ audience: false });
  const outputStateRef = useRef(outputState);
  outputStateRef.current = outputState;

  useEffect(() => {
    void window.castApi.getNdiDiagnostics().then(setDiagnostics).catch((error) => {
      console.error('[NdiProvider] Failed to get NDI diagnostics:', error);
    });
    void window.castApi.getNdiOutputConfigs().then(setOutputConfigs).catch((error) => {
      console.error('[NdiProvider] Failed to get output config:', error);
    });
    void window.castApi.getNdiOutputState().then(setOutputState).catch((error) => {
      console.error('[NdiProvider] Failed to get output state:', error);
    });

    const unsubscribeOutput = window.castApi.onNdiOutputStateChanged(setOutputState);
    const unsubscribeDiagnostics = window.castApi.onNdiDiagnosticsChanged(setDiagnostics);
    return () => {
      unsubscribeOutput();
      unsubscribeDiagnostics();
    };
  }, []);

  const setOutputEnabled = useCallback((name: NdiOutputName, enabled: boolean) => {
    void window.castApi.setNdiOutputEnabled(name, enabled).then(setOutputState).catch((error) => {
      console.error('[NdiProvider] Failed to update output state:', error);
    });
  }, []);

  const toggleAudienceOutput = useCallback(() => {
    setOutputEnabled('audience', !outputStateRef.current.audience);
  }, [setOutputEnabled]);

  const updateOutputConfig = useCallback((name: NdiOutputName, config: Partial<NdiOutputConfig>) => {
    void window.castApi.updateNdiOutputConfig(name, config).then(setOutputConfigs).catch((error) => {
      console.error('[NdiProvider] Failed to update output config:', error);
    });
  }, []);

  const value = useMemo(() => ({
    diagnostics,
    outputConfigs,
    outputState,
    setOutputEnabled,
    toggleAudienceOutput,
    updateOutputConfig,
  }), [
    diagnostics,
    outputConfigs,
    outputState,
    setOutputEnabled,
    toggleAudienceOutput,
    updateOutputConfig,
  ]);

  return <NdiContext.Provider value={value}>{children}</NdiContext.Provider>;
}

export function useNdi(): NdiContextValue {
  const ctx = useContext(NdiContext);
  if (!ctx) throw new Error('useNdi must be used within NdiProvider');
  return ctx;
}
