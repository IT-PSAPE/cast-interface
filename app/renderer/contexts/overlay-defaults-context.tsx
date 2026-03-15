import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { OverlayAnimation } from '@core/types';

const STORAGE_KEY = 'cast-interface.overlay-defaults.v1';

export interface OverlayDefaultsState {
  animationKind: OverlayAnimation['kind'];
  durationMs: number;
  autoClearDurationMs: number | null;
}

interface OverlayDefaultsContextValue {
  overlayDefaults: OverlayDefaultsState;
  updateOverlayDefaults: (next: Partial<OverlayDefaultsState>) => void;
}

const DEFAULT_OVERLAY_DEFAULTS: OverlayDefaultsState = {
  animationKind: 'dissolve',
  durationMs: 400,
  autoClearDurationMs: null,
};

const OverlayDefaultsContext = createContext<OverlayDefaultsContextValue | null>(null);

export function OverlayDefaultsProvider({ children }: { children: ReactNode }) {
  const [overlayDefaults, setOverlayDefaults] = useState<OverlayDefaultsState>(getStoredOverlayDefaults);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overlayDefaults));
  }, [overlayDefaults]);

  const updateOverlayDefaults = useCallback((next: Partial<OverlayDefaultsState>) => {
    setOverlayDefaults((current) => sanitizeOverlayDefaults({
      ...current,
      ...next,
    }));
  }, []);

  const value = useMemo<OverlayDefaultsContextValue>(() => ({
    overlayDefaults,
    updateOverlayDefaults,
  }), [overlayDefaults, updateOverlayDefaults]);

  return <OverlayDefaultsContext.Provider value={value}>{children}</OverlayDefaultsContext.Provider>;
}

export function useOverlayDefaults(): OverlayDefaultsContextValue {
  const context = useContext(OverlayDefaultsContext);
  if (!context) throw new Error('useOverlayDefaults must be used within OverlayDefaultsProvider');
  return context;
}

function getStoredOverlayDefaults(): OverlayDefaultsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OVERLAY_DEFAULTS;
    return sanitizeOverlayDefaults(JSON.parse(raw) as Partial<OverlayDefaultsState>);
  } catch {
    return DEFAULT_OVERLAY_DEFAULTS;
  }
}

function sanitizeOverlayDefaults(value: Partial<OverlayDefaultsState>): OverlayDefaultsState {
  const animationKind = value.animationKind === 'none'
    || value.animationKind === 'dissolve'
    || value.animationKind === 'fade'
    || value.animationKind === 'pulse'
    ? value.animationKind
    : DEFAULT_OVERLAY_DEFAULTS.animationKind;
  const durationMs = sanitizeDuration(value.durationMs, DEFAULT_OVERLAY_DEFAULTS.durationMs);
  const autoClearDurationMs = value.autoClearDurationMs == null
    ? null
    : sanitizeDuration(value.autoClearDurationMs, DEFAULT_OVERLAY_DEFAULTS.durationMs);

  return {
    animationKind,
    durationMs,
    autoClearDurationMs,
  };
}

function sanitizeDuration(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}
