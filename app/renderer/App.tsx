import { CastProvider, useCast } from './contexts/cast-context';
import { NdiProvider } from './contexts/ndi-context';
import { NavigationProvider } from './contexts/navigation-context';
import { PresentationLayerProvider } from './contexts/presentation-layer-context';
import { SlideProvider } from './contexts/slide-context';
import { ElementProvider } from './contexts/element-context';
import { UIProvider, useUI } from './contexts/ui-context';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { CommandBar } from './features/playback/components/command-bar';
import { ShowViewLayout } from './features/workspace/components/show-view-layout';
import { EditViewLayout } from './features/workspace/components/edit-view-layout';
import { ErrorBoundary } from './components/error-boundary';
import { RenderSceneProvider } from './features/workspace/rendering/render-scene-provider';
import { StatusBar } from './components/status-bar';
import { useWorkbenchPanelLayout } from './features/workspace/hooks/use-workbench-panel-layout';

export function App() {
  return (
    <ErrorBoundary>
      <CastProvider>
        <NdiProvider>
          <NavigationProvider>
            <PresentationLayerProvider>
              <SlideProvider>
                <ElementProvider>
                  <UIProvider>
                    <RenderSceneProvider>
                      <AppLayout />
                    </RenderSceneProvider>
                  </UIProvider>
                </ElementProvider>
              </SlideProvider>
            </PresentationLayerProvider>
          </NavigationProvider>
        </NdiProvider>
      </CastProvider>
    </ErrorBoundary>
  );
}

function AppLayout() {
  useKeyboardShortcuts();
  const { snapshot } = useCast();
  const { workspaceView } = useUI();
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
    panelLayout.togglePanel('edit', 'left');
  }

  function handleToggleEditRightPanel() {
    panelLayout.togglePanel('edit', 'right');
  }

  const showPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelLayout.panelVisibility.show.left, onToggle: handleToggleShowLeftPanel },
    { id: 'bottom' as const, label: 'Bottom', active: panelLayout.panelVisibility.show.bottom, onToggle: handleToggleShowBottomPanel },
    { id: 'right' as const, label: 'Right', active: panelLayout.panelVisibility.show.right, onToggle: handleToggleShowRightPanel },
  ];

  const editPanelToggles = [
    { id: 'left' as const, label: 'Left', active: panelLayout.panelVisibility.edit.left, onToggle: handleToggleEditLeftPanel },
    { id: 'right' as const, label: 'Right', active: panelLayout.panelVisibility.edit.right, onToggle: handleToggleEditRightPanel },
  ];

  const panelToggles = workspaceView === 'show' ? showPanelToggles : editPanelToggles;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto]">
      <CommandBar panelToggles={panelToggles} />
      {workspaceView === 'show' && (
        <ShowViewLayout
          liveLayouts={panelLayout.liveLayouts}
          startDrag={panelLayout.startDrag}
          updateDrag={panelLayout.updateDrag}
          endDrag={panelLayout.endDrag}
        />
      )}
      {workspaceView === 'edit' && (
        <EditViewLayout
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
