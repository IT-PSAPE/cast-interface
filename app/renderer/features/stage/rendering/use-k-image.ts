import { useEffect, useState } from 'react';

interface ImageCacheEntry {
  image: HTMLImageElement;
  listeners: Set<(status: 'loaded' | 'error') => void>;
  status: 'loading' | 'loaded' | 'error';
}

const imageCache = new Map<string, ImageCacheEntry>();

function createCacheEntry(src: string): ImageCacheEntry {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  const entry: ImageCacheEntry = {
    image,
    listeners: new Set(),
    status: 'loading',
  };

  function notify(status: 'loaded' | 'error') {
    entry.status = status;
    for (const listener of entry.listeners) {
      listener(status);
    }
  }

  image.addEventListener('load', () => {
    notify('loaded');
  });
  image.addEventListener('error', () => {
    notify('error');
  });
  image.src = src;

  if (image.complete) {
    entry.status = image.naturalWidth > 0 ? 'loaded' : 'error';
  }

  return entry;
}

function getImageCacheEntry(src: string): ImageCacheEntry {
  const existing = imageCache.get(src);
  if (existing) return existing;

  const next = createCacheEntry(src);
  imageCache.set(src, next);
  return next;
}

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
