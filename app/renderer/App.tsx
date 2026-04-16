import { useCast, useNdi } from './contexts/app-context';
import { AppProvider } from './contexts/app-context';
import { AssetEditorProvider } from './contexts/asset-editor/asset-editor-context';
import { CanvasProvider } from './contexts/canvas/canvas-context';
import { NavigationProvider } from './contexts/navigation-context';
import { PlaybackProvider } from './contexts/playback/playback-context';
import { SlideProvider } from './contexts/slide-context';
import { WorkbenchProvider } from './contexts/workbench-context';
import { NdiFrameCapture } from './features/playback/ndi-frame-capture';
import { ErrorBoundary } from './components/feedback/error-boundary';
import { AppToolbar } from './features/workbench/app-toolbar';
import { SplitPanel } from './features/workbench/split-panel';
import { StatusBar } from './features/workbench/status-bar';
import { useWorkbenchPanelToggles } from './features/workbench/use-workbench-panel-toggles';
import { WindowsInlineMenuBar } from './features/workbench/windows-inline-menu-bar';
import { WorkbenchScreenRouter } from './workbench-screen-router';

export function App() {
  return (
    <ErrorBoundary>
      <WorkbenchProvider>
        <AppProvider>
          <NavigationProvider>
            <PlaybackProvider>
              <SlideProvider>
                <AssetEditorProvider>
                  <CanvasProvider>
                    <NdiFrameCapture />
                    <SplitPanel>
                      <AppLayoutContent />
                    </SplitPanel>
                  </CanvasProvider>
                </AssetEditorProvider>
              </SlideProvider>
            </PlaybackProvider>
          </NavigationProvider>
        </AppProvider>
      </WorkbenchProvider>
    </ErrorBoundary>
  );
}

function AppLayoutContent() {
  const { snapshot } = useCast();
  const {
    state: { outputState },
    actions: { toggleAudienceOutput },
  } = useNdi();
  const panelToggles = useWorkbenchPanelToggles();

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center text-secondary">
        Loading Recast…
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col">
      <WindowsInlineMenuBar />
      <AppToolbar
        audienceOutputActive={outputState.audience}
        onToggleAudienceOutput={toggleAudienceOutput}
        panelToggles={panelToggles}
      />
      <main className="min-h-0 flex-1">
        <WorkbenchScreenRouter />
      </main>
      <StatusBar />
    </div>
  );
}
