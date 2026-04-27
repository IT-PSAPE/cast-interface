import { useCast } from './contexts/app-context';
import { AppProvider } from './contexts/app-context';
import { AssetEditorProvider } from './contexts/asset-editor/asset-editor-context';
import { CanvasProvider } from './contexts/canvas/canvas-context';
import { NavigationProvider } from './contexts/navigation-context';
import { PlaybackProvider } from './contexts/playback/playback-context';
import { SlideProvider } from './contexts/slide-context';
import { WorkbenchProvider } from './contexts/workbench-context';
import { CommandPalette } from './features/command-palette/command-palette';
import { CommandPaletteProvider } from './features/command-palette/command-palette-context';
import { BundleDropImport } from './features/deck/bundle-drop-import';
import { CreateDeckItemProvider } from './features/deck/create-deck-item';
import { LyricEditorProvider } from './features/deck/lyric-editor';
import { NdiFrameCapture } from './features/playback/ndi-frame-capture';
import { ErrorBoundary } from './components/feedback/error-boundary';
import { AppToolbar } from './features/workbench/app-toolbar';
import { SplitPanel } from './features/workbench/split-panel';
import { StatusBar } from './features/workbench/status-bar';
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
                  <LyricEditorProvider>
                    <CreateDeckItemProvider>
                      <CanvasProvider>
                        <CommandPaletteProvider>
                          <NdiFrameCapture />
                          <SplitPanel>
                            <AppLayoutContent />
                          </SplitPanel>
                          <CommandPalette />
                          <BundleDropImport />
                        </CommandPaletteProvider>
                      </CanvasProvider>
                    </CreateDeckItemProvider>
                  </LyricEditorProvider>
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

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-full text-secondary">
        Loading Recast App
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col">
      <WindowsInlineMenuBar>
        <AppToolbar />
      </WindowsInlineMenuBar>
      <main className="min-h-0 flex-1">
        <WorkbenchScreenRouter />
      </main>
      <StatusBar />
    </div>
  );
}
