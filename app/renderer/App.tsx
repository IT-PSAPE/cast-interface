import { CastProvider, useCast } from './contexts/cast-context';
import { ThemeProvider } from './contexts/theme-context';
import { NdiProvider } from './contexts/ndi-context';
import { NavigationProvider } from './contexts/navigation-context';
import { PresentationLayerProvider } from './contexts/presentation-layer-context';
import { SlideProvider } from './contexts/slide-context';
import { SlideEditorProvider } from './contexts/slide-editor-context';
import { ElementProvider } from './contexts/element-context';
import { OverlayEditorProvider } from './contexts/overlay-editor-context';
import { TemplateEditorProvider } from './contexts/template-editor-context';
import { InspectorProvider } from './contexts/inspector-context';
import { ResourceDrawerProvider } from './contexts/resource-drawer-context';
import { SlideBrowserProvider } from './contexts/slide-browser-context';
import { OverlayDefaultsProvider } from './contexts/overlay-defaults-context';
import { WorkbenchProvider, useWorkbench } from './contexts/workbench-context';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { AppToolbar } from './features/workbench/components/app-toolbar';
import { WindowsInlineMenuBar } from './features/workbench/components/windows-inline-menu-bar';
import { LibraryPanelProvider } from './features/library-browser/contexts/library-panel-context';
import { ShowModeLayout } from './features/workbench/components/show-mode-layout';
import { SlideEditorLayout } from './features/workbench/components/slide-editor-layout';
import { OverlayEditorLayout } from './features/workbench/components/overlay-editor-layout';
import { TemplateEditorLayout } from './features/workbench/components/template-editor-layout';
import { PanelRoute, usePanelRoute } from './features/workbench/components/panel-route';
import { ErrorBoundary } from './components/error-boundary';
import { RenderSceneProvider } from './features/stage/rendering/render-scene-provider';
import { StatusBar } from './components/status-bar';
import { useNdi } from './contexts/ndi-context';
import { ProgramOutputProvider } from './features/outputs/contexts/program-output-context';
import { ShowAudioProvider } from './features/outputs/contexts/show-audio-context';
import { NdiFrameCapture } from './features/outputs/components/ndi-frame-capture';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CastProvider>
          <NdiProvider>
            <NavigationProvider>
              <PresentationLayerProvider>
                <SlideProvider>
                  <WorkbenchProvider>
                    <SlideBrowserProvider>
                      <ResourceDrawerProvider>
                        <InspectorProvider>
                          <LibraryPanelProvider>
                            <OverlayDefaultsProvider>
                              <OverlayEditorProvider>
                                <TemplateEditorProvider>
                                  <SlideEditorProvider>
                                    <ElementProvider>
                                      <RenderSceneProvider>
                                        <ProgramOutputProvider>
                                          <ShowAudioProvider>
                                            <NdiFrameCapture />
                                            <AppLayout />
                                          </ShowAudioProvider>
                                        </ProgramOutputProvider>
                                      </RenderSceneProvider>
                                    </ElementProvider>
                                  </SlideEditorProvider>
                                </TemplateEditorProvider>
                              </OverlayEditorProvider>
                            </OverlayDefaultsProvider>
                          </LibraryPanelProvider>
                        </InspectorProvider>
                      </ResourceDrawerProvider>
                    </SlideBrowserProvider>
                  </WorkbenchProvider>
                </SlideProvider>
              </PresentationLayerProvider>
            </NavigationProvider>
          </NdiProvider>
        </CastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppLayout() {
  return (
    <PanelRoute.Root>
      <AppLayoutContent />
    </PanelRoute.Root>
  );
}

function AppLayoutContent() {
  useKeyboardShortcuts();
  const { snapshot } = useCast();
  const { outputState, toggleAudienceOutput } = useNdi();
  const { workbenchMode } = useWorkbench();
  const panelRoute = usePanelRoute();

  if (!snapshot) {
    return (
      <div className="grid place-items-center h-full text-text-secondary">
        Loading Cast Interface\u2026
      </div>
    );
  }

  function handleToggleShowLeftPanel() {
    panelRoute.actions.togglePanel('show-main', 'show-left');
  }

  function handleToggleShowBottomPanel() {
    panelRoute.actions.togglePanel('show-center', 'show-bottom');
  }

  function handleToggleShowRightPanel() {
    panelRoute.actions.togglePanel('show-main', 'show-right');
  }

  function handleToggleEditLeftPanel() {
    panelRoute.actions.togglePanel('edit-main', 'edit-left');
  }

  function handleToggleEditRightPanel() {
    panelRoute.actions.togglePanel('edit-main', 'edit-right');
  }

  function handleToggleEditBottomPanel() {
    panelRoute.actions.togglePanel('edit-center', 'edit-bottom');
  }

  function handleToggleOverlayLeftPanel() {
    panelRoute.actions.togglePanel('overlay-main', 'overlay-left');
  }

  function handleToggleOverlayRightPanel() {
    panelRoute.actions.togglePanel('overlay-main', 'overlay-right');
  }

  const showPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelRoute.meta.isPanelVisible('show-main', 'show-left'), onToggle: handleToggleShowLeftPanel },
    { id: 'bottom' as const, label: 'Bottom', active: panelRoute.meta.isPanelVisible('show-center', 'show-bottom'), onToggle: handleToggleShowBottomPanel },
    { id: 'right' as const, label: 'Right', active: panelRoute.meta.isPanelVisible('show-main', 'show-right'), onToggle: handleToggleShowRightPanel },
  ];

  const editPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelRoute.meta.isPanelVisible('edit-main', 'edit-left'), onToggle: handleToggleEditLeftPanel },
    { id: 'bottom' as const, label: 'Bottom', active: panelRoute.meta.isPanelVisible('edit-center', 'edit-bottom'), onToggle: handleToggleEditBottomPanel },
    { id: 'right' as const, label: 'Right', active: panelRoute.meta.isPanelVisible('edit-main', 'edit-right'), onToggle: handleToggleEditRightPanel },
  ];

  const overlayPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelRoute.meta.isPanelVisible('overlay-main', 'overlay-left'), onToggle: handleToggleOverlayLeftPanel },
    { id: 'right' as const, label: 'Right', active: panelRoute.meta.isPanelVisible('overlay-main', 'overlay-right'), onToggle: handleToggleOverlayRightPanel },
  ];

  const panelToggles = workbenchMode === 'show'
    ? showPanelToggles
    : workbenchMode === 'slide-editor'
      ? editPanelToggles
      : workbenchMode === 'template-editor'
        ? overlayPanelToggles
        : overlayPanelToggles;

  return (
    <div className="relative flex flex-col h-full">
      <WindowsInlineMenuBar />
      <AppToolbar audienceOutputActive={outputState.audience} onToggleAudienceOutput={toggleAudienceOutput} panelToggles={panelToggles} />
      <main className='flex-1'>
        {workbenchMode === 'show' && (
          <ShowModeLayout />
        )}
        {workbenchMode === 'slide-editor' && (
          <SlideEditorLayout />
        )}
        {workbenchMode === 'overlay-editor' && (
          <OverlayEditorLayout />
        )}
        {workbenchMode === 'template-editor' && (
          <TemplateEditorLayout />
        )}
      </main>
      <StatusBar />
    </div>
  );
}
