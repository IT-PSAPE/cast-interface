import { CastProvider, useCast } from './contexts/cast-context';
import { ThemeProvider } from './contexts/theme-context';
import { NdiProvider } from './contexts/ndi-context';
import { NavigationProvider } from './contexts/navigation-context';
import { PresentationLayerProvider } from './contexts/presentation-layer-context';
import { SlideProvider } from './contexts/slide-context';
import { SlideEditorProvider } from './contexts/slide-editor-context';
import { ElementProvider } from './contexts/element-context';
import { OverlayEditorProvider } from './contexts/overlay-editor-context';
import { InspectorProvider } from './contexts/inspector-context';
import { ResourceDrawerProvider } from './contexts/resource-drawer-context';
import { SlideBrowserProvider } from './contexts/slide-browser-context';
import { WorkbenchProvider, useWorkbench } from './contexts/workbench-context';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { AppToolbar } from './features/workbench/components/app-toolbar';
import { LibraryPanelProvider } from './features/library-browser/contexts/library-panel-context';
import { NdiOutputEmitter } from './features/outputs/components/ndi-output-emitter';
import { ShowModeLayout } from './features/workbench/components/show-mode-layout';
import { SlideEditorLayout } from './features/workbench/components/slide-editor-layout';
import { OverlayEditorLayout } from './features/workbench/components/overlay-editor-layout';
import { ErrorBoundary } from './components/error-boundary';
import { RenderSceneProvider } from './features/stage/rendering/render-scene-provider';
import { StatusBar } from './components/status-bar';
import { useNdi } from './contexts/ndi-context';
import { useWorkbenchPanelLayout } from './features/workbench/hooks/use-workbench-panel-layout';

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
                          <OverlayEditorProvider>
                            <SlideEditorProvider>
                              <ElementProvider>
                                <RenderSceneProvider>
                                  <AppLayout />
                                </RenderSceneProvider>
                              </ElementProvider>
                            </SlideEditorProvider>
                          </OverlayEditorProvider>
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
  useKeyboardShortcuts();
  const { snapshot } = useCast();
  const { outputState, toggleAudienceOutput } = useNdi();
  const { workbenchMode } = useWorkbench();
  const panelLayout = useWorkbenchPanelLayout();

  if (!snapshot) {
    return (
      <div className="grid place-items-center h-full text-text-secondary">
        Loading Cast Interface\u2026
      </div>
    );
  }

  function handleToggleShowLeftPanel() {
    panelLayout.togglePanel('show', 'left');
  }

  function handleToggleShowBottomPanel() {
    panelLayout.togglePanel('show', 'bottom');
  }

  function handleToggleShowRightPanel() {
    panelLayout.togglePanel('show', 'right');
  }

  function handleToggleEditLeftPanel() {
    panelLayout.togglePanel('slideEditor', 'left');
  }

  function handleToggleEditRightPanel() {
    panelLayout.togglePanel('slideEditor', 'right');
  }

  function handleToggleEditBottomPanel() {
    panelLayout.togglePanel('slideEditor', 'bottom');
  }

  function handleToggleOverlayLeftPanel() {
    panelLayout.togglePanel('overlayEditor', 'left');
  }

  function handleToggleOverlayRightPanel() {
    panelLayout.togglePanel('overlayEditor', 'right');
  }

  const showPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelLayout.panelVisibility.show.left, onToggle: handleToggleShowLeftPanel },
    { id: 'bottom' as const, label: 'Bottom', active: panelLayout.panelVisibility.show.bottom, onToggle: handleToggleShowBottomPanel },
    { id: 'right' as const, label: 'Right', active: panelLayout.panelVisibility.show.right, onToggle: handleToggleShowRightPanel },
  ];

  const editPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelLayout.panelVisibility.slideEditor.left, onToggle: handleToggleEditLeftPanel },
    { id: 'bottom' as const, label: 'Bottom', active: panelLayout.panelVisibility.slideEditor.bottom, onToggle: handleToggleEditBottomPanel },
    { id: 'right' as const, label: 'Right', active: panelLayout.panelVisibility.slideEditor.right, onToggle: handleToggleEditRightPanel },
  ];

  const overlayPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelLayout.panelVisibility.overlayEditor.left, onToggle: handleToggleOverlayLeftPanel },
    { id: 'right' as const, label: 'Right', active: panelLayout.panelVisibility.overlayEditor.right, onToggle: handleToggleOverlayRightPanel },
  ];

  const panelToggles = workbenchMode === 'show'
    ? showPanelToggles
    : workbenchMode === 'slide-editor'
      ? editPanelToggles
      : overlayPanelToggles;

  return (
    <div className="relative grid h-full min-h-0 grid-rows-[auto_1fr_auto]">
      <NdiOutputEmitter />
      <AppToolbar
        audienceOutputActive={outputState.audience}
        onToggleAudienceOutput={toggleAudienceOutput}
        panelToggles={panelToggles}
      />
      {workbenchMode === 'show' && (
        <ShowModeLayout
          liveLayouts={panelLayout.liveLayouts}
          startDrag={panelLayout.startDrag}
          updateDrag={panelLayout.updateDrag}
          endDrag={panelLayout.endDrag}
        />
      )}
      {workbenchMode === 'slide-editor' && (
        <SlideEditorLayout
          liveLayouts={panelLayout.liveLayouts}
          startDrag={panelLayout.startDrag}
          updateDrag={panelLayout.updateDrag}
          endDrag={panelLayout.endDrag}
        />
      )}
      {workbenchMode === 'overlay-editor' && (
        <OverlayEditorLayout
          liveLayouts={panelLayout.liveLayouts}
          startDrag={panelLayout.startDrag}
          updateDrag={panelLayout.updateDrag}
          endDrag={panelLayout.endDrag}
        />
      )}
      <StatusBar />
    </div>
  );
}
