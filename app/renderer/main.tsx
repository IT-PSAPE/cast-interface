import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './contexts/theme-context';
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
        <UiSpecScreen />
      </ThemeProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

function resolveRendererView(): 'app' | 'ui-spec' {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'ui-spec' ? 'ui-spec' : 'app';
}
