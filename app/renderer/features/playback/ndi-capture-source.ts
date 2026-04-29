import { useSyncExternalStore } from 'react';
import type { NdiOutputName } from '@core/types';

const captureSources = new Map<NdiOutputName, HTMLCanvasElement | null>();
const listeners = new Map<NdiOutputName, Set<() => void>>();

function emit(name: NdiOutputName) {
  const subscribers = listeners.get(name);
  if (!subscribers) return;
  for (const callback of subscribers) {
    callback();
  }
}

export function setNdiCaptureSource(name: NdiOutputName, canvas: HTMLCanvasElement | null) {
  const current = captureSources.get(name) ?? null;
  if (current === canvas) return;
  captureSources.set(name, canvas);
  emit(name);
}

function subscribe(name: NdiOutputName, callback: () => void): () => void {
  const subscribers = listeners.get(name) ?? new Set<() => void>();
  subscribers.add(callback);
  listeners.set(name, subscribers);
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      listeners.delete(name);
    }
  };
}

function getSnapshot(name: NdiOutputName): HTMLCanvasElement | null {
  return captureSources.get(name) ?? null;
}

export function useNdiCaptureSource(name: NdiOutputName): HTMLCanvasElement | null {
  return useSyncExternalStore(
    (callback) => subscribe(name, callback),
    () => getSnapshot(name),
    () => null,
  );
}
