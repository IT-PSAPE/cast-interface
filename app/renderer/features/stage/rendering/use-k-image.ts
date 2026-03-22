import { useEffect, useState } from 'react';
import { getImageCacheEntry } from './image-cache';

export function useKImage(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const entry = getImageCacheEntry(src);

    if (entry.status === 'loaded') {
      setImage(entry.image);
      return;
    }

    if (entry.status === 'error') {
      setImage(null);
      return;
    }

    function handleStatusChange(status: 'loaded' | 'error') {
      if (status === 'loaded') {
        setImage(entry.image);
        return;
      }

      setImage(null);
    }

    entry.listeners.add(handleStatusChange);

    return () => {
      entry.listeners.delete(handleStatusChange);
    };
  }, [src]);

  return image;
}
