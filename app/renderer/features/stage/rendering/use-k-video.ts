import { useEffect, useRef, useState } from 'react';
import type { ResolvedMediaState } from './scene-types';

interface UseKVideoOptions {
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
}

export function useKVideo(src: string | null, { autoplay, loop, muted }: UseKVideoOptions): ResolvedMediaState {
  const [state, setState] = useState<ResolvedMediaState>({ status: 'empty' });
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!src) {
      const current = activeVideoRef.current;
      if (current) {
        current.pause();
        current.removeAttribute('src');
        current.load();
      }
      activeVideoRef.current = null;
      setState({ status: 'empty' });
      return;
    }

    const nextVideo = document.createElement('video');
    nextVideo.src = src;
    nextVideo.autoplay = autoplay;
    nextVideo.loop = loop;
    nextVideo.muted = muted;
    nextVideo.playsInline = true;
    nextVideo.crossOrigin = 'anonymous';
    nextVideo.preload = 'metadata';
    let promoted = false;
    setState({ status: 'loading' });

    function handleReady() {
      promoted = true;
      const previous = activeVideoRef.current;
      if (previous && previous !== nextVideo) {
        previous.pause();
        previous.removeAttribute('src');
        previous.load();
      }
      activeVideoRef.current = nextVideo;
      setState({ status: 'loaded', resource: nextVideo });
      if (autoplay) {
        void nextVideo.play().catch(() => undefined);
      }
    }

    function handleError() {
      if (promoted) return;
      const previous = activeVideoRef.current;
      if (previous && previous !== nextVideo) {
        previous.pause();
        previous.removeAttribute('src');
        previous.load();
        activeVideoRef.current = null;
      }
      setState({ status: 'broken' });
    }

    nextVideo.addEventListener('loadeddata', handleReady);
    nextVideo.addEventListener('error', handleError);
    nextVideo.load();

    return () => {
      nextVideo.removeEventListener('loadeddata', handleReady);
      nextVideo.removeEventListener('error', handleError);
      if (promoted) return;
      nextVideo.pause();
      nextVideo.removeAttribute('src');
      nextVideo.load();
    };
  }, [autoplay, loop, muted, src]);

  useEffect(() => {
    return () => {
      const current = activeVideoRef.current;
      if (!current) return;
      current.pause();
      current.removeAttribute('src');
      current.load();
      activeVideoRef.current = null;
    };
  }, []);

  return state;
}
