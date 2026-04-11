import { useCallback, useState } from 'react';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getStoredSize(key: string, defaultValue: number, min: number, max: number): number {
  const stored = window.localStorage.getItem(key);
  if (!stored) return defaultValue;
  const parsed = Number(stored);
  if (Number.isNaN(parsed)) return defaultValue;
  return clamp(parsed, min, max);
}

export function useGridSize(storageKey: string, defaultValue: number, min: number, max: number, step: number = 1) {
  const [gridSize, setGridSizeRaw] = useState(() => getStoredSize(storageKey, defaultValue, min, max));

  const setGridSize = useCallback((size: number) => {
    const clamped = clamp(size, min, max);
    setGridSizeRaw(clamped);
    window.localStorage.setItem(storageKey, String(clamped));
  }, [storageKey, min, max]);

  return { gridSize, setGridSize, min, max, step } as const;
}
