import { useEffect, useRef, useState } from 'react';

const coverArtCache = new Map<string, string | null>();

export function useAudioCoverArt(src: string): string | null {
  const [coverArt, setCoverArt] = useState<string | null>(() => coverArtCache.get(src) ?? null);
  const srcRef = useRef(src);
  srcRef.current = src;

  useEffect(() => {
    if (coverArtCache.has(src)) {
      setCoverArt(coverArtCache.get(src) ?? null);
      return;
    }

    let cancelled = false;

    window.castApi.getAudioCoverArt(src).then((result) => {
      coverArtCache.set(src, result);
      if (!cancelled && srcRef.current === src) setCoverArt(result);
    }).catch(() => {
      coverArtCache.set(src, null);
      if (!cancelled && srcRef.current === src) setCoverArt(null);
    });

    return () => { cancelled = true; };
  }, [src]);

  return coverArt;
}
