import { useEffect, useRef, useState } from 'react';
import type { ResolvedMediaState } from './scene-types';

interface UseKVideoOptions {
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
}

interface VideoPoolEntry {
  key: string;
  status: 'loading' | 'broken' | 'loaded';
  refCount: number;
  video: HTMLVideoElement;
  listeners: Set<() => void>;
  cleanup: () => void;
}

const videoPool = new Map<string, VideoPoolEntry>();

function getVideoPoolKey(src: string, { autoplay, loop, muted }: UseKVideoOptions): string {
  return [src, autoplay ? '1' : '0', loop ? '1' : '0', muted ? '1' : '0'].join('|');
}

function toResolvedMediaState(entry: VideoPoolEntry): ResolvedMediaState {
  if (entry.status === 'loaded') {
    return { status: 'loaded', resource: entry.video };
  }

  return { status: entry.status };
}

function notifyListeners(entry: VideoPoolEntry) {
  entry.listeners.forEach((listener) => {
    listener();
  });
}

function createVideoPoolEntry(src: string, { autoplay, loop, muted }: UseKVideoOptions): VideoPoolEntry {
  const video = document.createElement('video');
  video.src = src;
  video.autoplay = autoplay;
  video.loop = loop;
  video.muted = muted;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'metadata';

  const entry: VideoPoolEntry = {
    key: getVideoPoolKey(src, { autoplay, loop, muted }),
    status: 'loading',
    refCount: 0,
    video,
    listeners: new Set(),
    cleanup: () => undefined,
  };

  const handleReady = () => {
    entry.status = 'loaded';
    notifyListeners(entry);
    if (autoplay) {
      void video.play().catch(() => undefined);
    }
  };

  const handleError = () => {
    if (entry.status === 'loaded') return;
    entry.status = 'broken';
    notifyListeners(entry);
  };

  video.addEventListener('loadeddata', handleReady);
  video.addEventListener('error', handleError);
  entry.cleanup = () => {
    video.removeEventListener('loadeddata', handleReady);
    video.removeEventListener('error', handleError);
    video.pause();
    video.removeAttribute('src');
    video.load();
  };

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    handleReady();
  } else {
    video.load();
  }

  return entry;
}

function acquireVideoEntry(src: string, options: UseKVideoOptions): VideoPoolEntry {
  const key = getVideoPoolKey(src, options);
  let entry = videoPool.get(key);
  if (!entry) {
    entry = createVideoPoolEntry(src, options);
    videoPool.set(key, entry);
  }

  entry.refCount += 1;
  if (entry.status === 'loaded' && options.autoplay) {
    void entry.video.play().catch(() => undefined);
  }
  return entry;
}

function releaseVideoEntry(entry: VideoPoolEntry) {
  entry.refCount -= 1;
  if (entry.refCount > 0) return;

  videoPool.delete(entry.key);
  entry.cleanup();
}

export function useKVideo(src: string | null, { autoplay, loop, muted }: UseKVideoOptions): ResolvedMediaState {
  const [state, setState] = useState<ResolvedMediaState>({ status: 'empty' });
  const activeEntryRef = useRef<VideoPoolEntry | null>(null);

  useEffect(() => {
    if (!src) {
      const currentEntry = activeEntryRef.current;
      if (currentEntry) {
        releaseVideoEntry(currentEntry);
      }
      activeEntryRef.current = null;
      setState({ status: 'empty' });
      return;
    }

    const entry = acquireVideoEntry(src, { autoplay, loop, muted });
    activeEntryRef.current = entry;
    setState(toResolvedMediaState(entry));

    const handleChange = () => {
      setState(toResolvedMediaState(entry));
    };

    entry.listeners.add(handleChange);

    return () => {
      entry.listeners.delete(handleChange);
      if (activeEntryRef.current === entry) {
        activeEntryRef.current = null;
      }
      releaseVideoEntry(entry);
    };
  }, [autoplay, loop, muted, src]);

  useEffect(() => {
    return () => {
      const currentEntry = activeEntryRef.current;
      if (!currentEntry) return;
      releaseVideoEntry(currentEntry);
      activeEntryRef.current = null;
    };
  }, []);

  return state;
}
