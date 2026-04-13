import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const OVERLAY_ROOT_ID = 'overlay-root';
const OVERLAY_BASE_Z_INDEX = 1;

type OverlayStackContextValue = {
  state: {
    rootElement: HTMLElement | null;
    stack: string[];
  };
  actions: {
    register: (id: string) => void;
    unregister: (id: string) => void;
  };
  meta: {
    baseZIndex: number;
  };
};

const OverlayStackContext = createContext<OverlayStackContextValue | null>(null);

function ensureOverlayRoot() {
  const existingRoot = document.getElementById(OVERLAY_ROOT_ID);

  if (existingRoot) {
    return existingRoot;
  }

  const nextRoot = document.createElement('div');
  nextRoot.id = OVERLAY_ROOT_ID;
  document.body.append(nextRoot);

  return nextRoot;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [rootElement] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    return ensureOverlayRoot();
  });
  const [stack, setStack] = useState<string[]>([]);

  const register = useCallback((id: string) => {
    setStack(previousStack => {
      if (previousStack.includes(id)) {
        return previousStack;
      }

      return [...previousStack, id];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setStack(previousStack => {
      const next = previousStack.filter(entryId => entryId !== id);
      return next.length === previousStack.length ? previousStack : next;
    });
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (stack.length > 0) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [stack.length]);

  const state = useMemo<OverlayStackContextValue['state']>(() => ({
    rootElement,
    stack,
  }), [rootElement, stack]);

  const actions = useMemo<OverlayStackContextValue['actions']>(() => ({
    register,
    unregister,
  }), [register, unregister]);

  const meta = useMemo<OverlayStackContextValue['meta']>(() => ({
    baseZIndex: OVERLAY_BASE_Z_INDEX,
  }), []);

  const value = useMemo<OverlayStackContextValue>(() => ({
    state,
    actions,
    meta,
  }), [actions, meta, state]);

  return (
    <OverlayStackContext.Provider value={value}>
      {children}
    </OverlayStackContext.Provider>
  );
}

export function useOverlayStack() {
  const context = useContext(OverlayStackContext);

  if (!context) {
    throw new Error('useOverlayStack must be used within an OverlayProvider');
  }

  return context;
}
