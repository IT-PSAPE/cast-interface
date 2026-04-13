interface ImageCacheEntry {
  image: HTMLImageElement;
  listeners: Set<(status: 'loaded' | 'error') => void>;
  status: 'loading' | 'loaded' | 'error';
}

const MAX_ENTRIES = 64;

const cache = new Map<string, ImageCacheEntry>();

function createEntry(src: string): ImageCacheEntry {
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

function evictIfNeeded() {
  if (cache.size <= MAX_ENTRIES) return;

  for (const [key, entry] of cache) {
    if (cache.size <= MAX_ENTRIES) break;
    if (entry.listeners.size > 0) continue;
    entry.image.src = '';
    cache.delete(key);
  }
}

export function getImageCacheEntry(src: string): ImageCacheEntry {
  const existing = cache.get(src);
  if (existing) {
    cache.delete(src);
    cache.set(src, existing);
    return existing;
  }

  const next = createEntry(src);
  cache.set(src, next);
  evictIfNeeded();
  return next;
}

export type { ImageCacheEntry };
