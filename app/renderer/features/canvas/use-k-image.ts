import { useEffect, useState } from 'react';
import type { ResolvedMediaState } from './scene-types';
import { getImageCacheEntry } from './image-cache';

export function useKImage(src: string | null): ResolvedMediaState {
  const [state, setState] = useState<ResolvedMediaState>({ status: 'empty' });

  useEffect(() => {
    if (!src) {
      setState({ status: 'empty' });
      return;
    }
    const entry = getImageCacheEntry(src);

    if (entry.status === 'loaded') {
      setState({ status: 'loaded', resource: entry.image });
      return;
    }

    if (entry.status === 'error') {
      setState({ status: 'broken' });
      return;
    }

    setState({ status: 'loading' });

    function handleStatusChange(status: 'loaded' | 'error') {
      if (status === 'loaded') {
        setState({ status: 'loaded', resource: entry.image });
        return;
      }

      setState({ status: 'broken' });
    }

    entry.listeners.add(handleStatusChange);

    return () => {
      entry.listeners.delete(handleStatusChange);
    };
  }, [src]);

  return state;
}
