import { createContext, useContext, type ReactNode } from 'react';
import { EmptyStatePanel } from '../../../components/empty-state-panel';
import { StageViewport } from '../../stage/components/stage-viewport';
import { useSlideBrowserView } from '../hooks/use-slide-browser-view';
import { SlideBrowserPlaylistTabStrip } from './slide-browser-playlist-tab-strip';
import { SlideBrowserToolbar } from './slide-browser-toolbar';
import { ContinuousSlideGrid } from './continuous-slide-grid';
import { ContinuousSlideList } from './continuous-slide-list';
import { SlideGrid } from './slide-grid';
import { SlideList } from './slide-list';

interface SlideBrowserContextValue {
  actions: Record<string, never>;
  meta: Record<string, never>;
  state: ReturnType<typeof useSlideBrowserView>;
}

const SlideBrowserContext = createContext<SlideBrowserContextValue | null>(null);

function useSlideBrowserLayout() {
  const context = useContext(SlideBrowserContext);
  if (!context) throw new Error('SlideBrowser sub-components must be used within SlideBrowserLayout.Root');
  return context;
}

function Root({ children }: { children: ReactNode }) {
  const state = useSlideBrowserView();

  return (
    <SlideBrowserContext.Provider value={{ actions: {}, meta: {}, state }}>
      <main
        data-ui-region="slide-browser"
        className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden bg-gradient-to-b from-background-primary/90 to-background-primary"
      >
        {children}
      </main>
    </SlideBrowserContext.Provider>
  );
}

function TabsHeader() {
  const { state } = useSlideBrowserLayout();
  if (state.headerVariant !== 'tabs') return null;

  return (
    <div className="row-start-1 min-h-0">
      <SlideBrowserPlaylistTabStrip items={state.items} />
    </div>
  );
}

function EmptyState() {
  const { state } = useSlideBrowserLayout();
  if (state.contentVariant !== 'empty') return null;

  return (
    <div className="row-start-2 min-h-0">
      <EmptyStatePanel
        glyph={<EmptyStateGlyph />}
        title="No item selected"
        description="Select an item from a playlist or from the content drawer to load slides in the browser."
      />
    </div>
  );
}

function FocusContent() {
  const { state } = useSlideBrowserLayout();
  if (state.contentVariant !== 'focus') return null;

  return (
    <section className="row-start-2 min-h-0 overflow-hidden">
      <section className="h-full min-h-0 overflow-hidden p-2">
        <StageViewport />
      </section>
    </section>
  );
}

function SingleGridContent() {
  const { state } = useSlideBrowserLayout();
  if (state.contentVariant !== 'single-grid') return null;

  return (
    <section className="row-start-2 min-h-0 overflow-hidden">
      <section className="h-full min-h-0">
        <SlideGrid />
      </section>
    </section>
  );
}

function SingleListContent() {
  const { state } = useSlideBrowserLayout();
  if (state.contentVariant !== 'single-list') return null;

  return (
    <section className="row-start-2 min-h-0 overflow-hidden">
      <section className="h-full min-h-0">
        <SlideList />
      </section>
    </section>
  );
}

function ContinuousGridContent() {
  const { state } = useSlideBrowserLayout();
  if (state.contentVariant !== 'continuous-grid') return null;

  return (
    <section className="row-start-2 min-h-0 overflow-hidden">
      <section className="h-full min-h-0">
        <ContinuousSlideGrid items={state.items} />
      </section>
    </section>
  );
}

function ContinuousListContent() {
  const { state } = useSlideBrowserLayout();
  if (state.contentVariant !== 'continuous-list') return null;

  return (
    <section className="row-start-2 min-h-0 overflow-hidden">
      <section className="h-full min-h-0">
        <ContinuousSlideList items={state.items} />
      </section>
    </section>
  );
}

function Footer() {
  return (
    <div className="row-start-3 min-h-0">
      <SlideBrowserToolbar />
    </div>
  );
}

const SlideBrowserLayout = {
  ContinuousGridContent,
  ContinuousListContent,
  EmptyState,
  FocusContent,
  Footer,
  Root,
  SingleGridContent,
  SingleListContent,
  TabsHeader
};

export function SlideBrowser() {
  return (
    <SlideBrowserLayout.Root>
      <SlideBrowserLayout.TabsHeader />
      <SlideBrowserLayout.EmptyState />
      <SlideBrowserLayout.FocusContent />
      <SlideBrowserLayout.SingleGridContent />
      <SlideBrowserLayout.SingleListContent />
      <SlideBrowserLayout.ContinuousGridContent />
      <SlideBrowserLayout.ContinuousListContent />
      <SlideBrowserLayout.Footer />
    </SlideBrowserLayout.Root>
  );
}

function EmptyStateGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8 fill-none stroke-current" aria-hidden="true">
      <rect x="4" y="7" width="32" height="26" rx="3" strokeWidth="1.5" />
      <line x1="10" y1="15" x2="30" y2="15" strokeWidth="1.5" />
      <line x1="10" y1="21" x2="30" y2="21" strokeWidth="1.5" />
      <line x1="10" y1="27" x2="22" y2="27" strokeWidth="1.5" />
    </svg>
  );
}
