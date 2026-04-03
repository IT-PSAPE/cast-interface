import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LibraryPanelProvider } from './features/show/library/contexts/library-panel-context';
import { NdiProvider } from './contexts/ndi-context';
import { OverlayDefaultsProvider } from './contexts/overlay-defaults-context';
import { SlideBrowserProvider } from './features/show/slides/contexts/slide-browser-context';
import { ThemeProvider } from './contexts/theme-context';
import { WorkbenchProvider } from './contexts/workbench-context';
import { UiSpecScreen } from './spec/ui-spec-screen';
import './theme.css';

window.addEventListener('error', (event) => {
  console.error('[Global error]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled rejection]', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {resolveRendererView() === 'ui-spec' ? (
      <ThemeProvider>
        <NdiProvider>
          <WorkbenchProvider>
            <SlideBrowserProvider>
              <LibraryPanelProvider>
                <OverlayDefaultsProvider>
                  <UiSpecScreen />
                </OverlayDefaultsProvider>
              </LibraryPanelProvider>
            </SlideBrowserProvider>
          </WorkbenchProvider>
        </NdiProvider>
      </ThemeProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

function resolveRendererView(): 'app' | 'ui-spec' {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'ui-spec') return 'ui-spec';
  return 'app';
}
