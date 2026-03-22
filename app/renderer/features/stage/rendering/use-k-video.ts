import { useEffect, useRef, useState } from 'react';

interface UseKVideoOptions {
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
}

export function useKVideo(src: string | null, { autoplay, loop, muted }: UseKVideoOptions): HTMLVideoElement | null {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    activeVideoRef.current = video;
  }, [video]);

  useEffect(() => {
    if (!src) {
      const current = activeVideoRef.current;
      if (current) {
        current.pause();
        current.removeAttribute('src');
        current.load();
      }
      activeVideoRef.current = null;
      setVideo(null);
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

    function handleReady() {
      promoted = true;
      const previous = activeVideoRef.current;
      if (previous && previous !== nextVideo) {
        previous.pause();
        previous.removeAttribute('src');
        previous.load();
      }
      activeVideoRef.current = nextVideo;
      setVideo(nextVideo);
      if (autoplay) {
        void nextVideo.play().catch(() => undefined);
      }
    }

    nextVideo.addEventListener('loadeddata', handleReady);
    nextVideo.load();

    return () => {
      nextVideo.removeEventListener('loadeddata', handleReady);
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

  return video;
}
