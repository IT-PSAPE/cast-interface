import { useEffect, useState } from 'react';

interface UseKVideoOptions {
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
}

export function useKVideo(src: string | null, { autoplay, loop, muted }: UseKVideoOptions): HTMLVideoElement | null {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!src) {
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

    function handleReady() {
      setVideo(nextVideo);
      if (autoplay) {
        void nextVideo.play().catch(() => undefined);
      }
    }

    nextVideo.addEventListener('loadeddata', handleReady);
    nextVideo.load();

    return () => {
      nextVideo.pause();
      nextVideo.removeAttribute('src');
      nextVideo.load();
      nextVideo.removeEventListener('loadeddata', handleReady);
    };
  }, [autoplay, loop, muted, src]);

  return video;
}
