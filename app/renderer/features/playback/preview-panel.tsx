import { useState } from 'react';
import { ChevronDown, AlignLeft, Image, Layers, Layers2, LayoutGrid, Plus, RectangleHorizontal, VolumeX, XCircle } from 'lucide-react';
import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import { ReacstButton } from '@renderer/components 2.0/button';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { Tabs } from '../../components/display/tabs';
import { Dropdown } from '../../components/form/dropdown';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { IconGroup } from '@renderer/components/icon-group';
import { useNdi } from '../../contexts/app-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useOverlayEditor, useStageEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useAudio, usePresentationLayers } from '../../contexts/playback/playback-context';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { useGridSize } from '../../hooks/use-grid-size';
import type { PreviewSurfaceKind } from '../../types/ui';
import { OverlayBinPanel } from '../assets/overlays/overlay-bin-panel';
import { StageBinPanel } from '../assets/stages/stage-bin-panel';
import { useProgramOutput } from './use-program-output';
import { useStageScene } from './use-stage-scene';
import { SceneStage } from '../canvas/scene-stage';

type BottomTab = 'overlays' | 'stage';

export function PreviewPanel() {
  const { clearLayer, clearAllLayers, mediaLayerAsset, contentLayerVisible, activeOverlays, overlayMode, setOverlayMode } = usePresentationLayers();
  const { currentOutputDeckItemId } = useNavigation();
  const audio = useAudio();
  const { createOverlay } = useOverlayEditor();
  const { createStage } = useStageEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { gridSize: overlayGridSize, setGridSize: setOverlayGridSize, min: overlayGridMin, max: overlayGridMax } = useGridSize('recast.grid-size.overlay-bin', 3, 2, 4);
  const { gridSize: stageGridSize, setGridSize: setStageGridSize, min: stageGridMin, max: stageGridMax } = useGridSize('recast.grid-size.stage-bin', 3, 2, 4);
  const [bottomTab, setBottomTab] = useState<BottomTab>('overlays');
  const mediaActive = Boolean(mediaLayerAsset);
  const contentActive = contentLayerVisible && Boolean(currentOutputDeckItemId);
  const overlayActive = activeOverlays.length > 0;
  const audioActive = audio.isPlaying || audio.currentTime > 0;

  function handleClearMedia() { clearLayer('media'); }
  function handleClearContent() { clearLayer('content'); }
  function handleClearOverlay() { clearLayer('overlay'); }
  function handleClearAudio() { audio.clearAudio(); }
  function handleClearAll() {
    audio.clearAudio();
    clearAllLayers();
  }

  function handleOverlayModeToggle() {
    setOverlayMode(overlayMode === 'single' ? 'multiple' : 'single');
  }

  function handleCreateOverlay() {
    void createOverlay().then(() => {
      setWorkbenchMode('overlay-editor');
    });
  }

  function handleCreateStage() {
    void createStage().then(() => {
      setWorkbenchMode('stage-editor');
    });
  }

  function handleTabChange(value: string) {
    if (value === 'overlays' || value === 'stage') setBottomTab(value);
  }

  const overlayModeLabel = overlayMode === 'single' ? 'Single overlay mode — click to allow multiple' : 'Multiple overlay mode — click for single';
  const showOverlayActions = bottomTab === 'overlays';
  const activeGridSize = bottomTab === 'overlays' ? overlayGridSize : stageGridSize;
  const activeGridMin = bottomTab === 'overlays' ? overlayGridMin : stageGridMin;
  const activeGridMax = bottomTab === 'overlays' ? overlayGridMax : stageGridMax;
  const handleActiveGridSizeChange = bottomTab === 'overlays' ? setOverlayGridSize : setStageGridSize;

  return (
    <RecastPanel.Root className='h-full border-l border-secondary' >
      <RecastPanel.Group>
        <PreviewModeHeader />
        <SurfacesArea />
        <IconGroup.Root fill className='rounded-none' >
          <IconGroup.Item aria-label="Clear all layers" title="Clear all layers" onClick={handleClearAll}>
            <XCircle className="size-4" />
          </IconGroup.Item>
          <IconGroup.Item active={mediaActive} aria-label="Clear media layer" title="Clear media layer" onClick={handleClearMedia}>
            <Image className="size-4" />
          </IconGroup.Item>
          <IconGroup.Item active={contentActive} aria-label="Clear content layer" title="Clear content layer" onClick={handleClearContent}>
            <AlignLeft className="size-4" />
          </IconGroup.Item>
          <IconGroup.Item active={overlayActive} aria-label="Clear overlays" title="Clear overlays" onClick={handleClearOverlay}>
            <Layers2 className="size-4" />
          </IconGroup.Item>
          <IconGroup.Item active={audioActive} aria-label="Clear audio" title="Clear audio" onClick={handleClearAudio}>
            <VolumeX className="size-4" />
          </IconGroup.Item>
        </IconGroup.Root>
      </RecastPanel.Group>
      <RecastPanel.Group className='flex-1' >
        <Tabs.Root value={bottomTab} onValueChange={handleTabChange}>
          <RecastPanel.GroupTitle>
            <Tabs.List label="Bottom panel" className="mr-auto" tabsClassName="gap-2">
              <Tabs.Trigger value="overlays">Overlays</Tabs.Trigger>
              <Tabs.Trigger value="stage">Stage</Tabs.Trigger>
            </Tabs.List>
            {showOverlayActions ? (
              <>
                <ReacstButton.Icon label={overlayModeLabel} variant="ghost" onClick={handleOverlayModeToggle}>
                  {overlayMode === 'single' ? <Layers /> : <Layers2 />}
                </ReacstButton.Icon>
                <ReacstButton.Icon label="Add overlay" onClick={handleCreateOverlay}>
                  <Plus />
                </ReacstButton.Icon>
              </>
            ) : (
              <ReacstButton.Icon label="Add stage" onClick={handleCreateStage}>
                <Plus />
              </ReacstButton.Icon>
            )}
          </RecastPanel.GroupTitle>
          <RecastPanel.Content className='flex-1 py-2 px-1'>
            {bottomTab === 'overlays' ? (
              <OverlayBinPanel filterText="" gridItemSize={overlayGridSize} />
            ) : (
              <StageBinPanel filterText="" gridItemSize={stageGridSize} />
            )}
          </RecastPanel.Content>
          <RecastPanel.GroupFooter>
            <GridSizeSlider value={activeGridSize} min={activeGridMin} max={activeGridMax} onChange={handleActiveGridSizeChange} />
          </RecastPanel.GroupFooter>
        </Tabs.Root>
      </RecastPanel.Group>
    </RecastPanel.Root>
  );
}

const SURFACE_LABELS: Record<PreviewSurfaceKind, string> = {
  preview: 'Preview',
  monitor: 'Monitor',
  stage: 'Stage',
};

const SURFACE_ORDER: PreviewSurfaceKind[] = ['preview', 'monitor', 'stage'];

function PreviewModeHeader() {
  const {
    state: { previewMode, previewSingleSurface, previewGridDensity },
    actions: { setPreviewMode, setPreviewSingleSurface, setPreviewGridDensity },
  } = useWorkbench();

  function handleModeToggle() {
    setPreviewMode(previewMode === 'single' ? 'all' : 'single');
  }

  function handleSurfacePick(surface: PreviewSurfaceKind) {
    setPreviewSingleSurface(surface);
  }

  function handleDensityChange(next: number) {
    if (next !== 1 && next !== 2) return;
    setPreviewGridDensity(next);
  }

  return (
    <RecastPanel.GroupTitle>
      <ReacstButton.Icon
        variant="ghost"
        label={previewMode === 'single' ? 'Switch to all previews' : 'Switch to single preview'}
        onClick={handleModeToggle}
      >
        {previewMode === 'single' ? <RectangleHorizontal /> : <LayoutGrid />}
      </ReacstButton.Icon>
      {previewMode === 'single' ? (
        <Dropdown className="ml-auto">
          <Dropdown.Trigger className="flex min-w-0 items-center gap-1 rounded-sm bg-tertiary px-2 py-1 text-sm text-primary transition-colors hover:bg-quaternary">
            <span className="truncate">{SURFACE_LABELS[previewSingleSurface]}</span>
            <ChevronDown className="size-3.5 shrink-0 text-tertiary" />
          </Dropdown.Trigger>
          <Dropdown.Panel placement="bottom-end">
            {SURFACE_ORDER.map((kind) => (
              <Dropdown.Item key={kind} onClick={() => handleSurfacePick(kind)}>
                {SURFACE_LABELS[kind]}
              </Dropdown.Item>
            ))}
          </Dropdown.Panel>
        </Dropdown>
      ) : (
        <span className="ml-auto">
          <GridSizeSlider value={previewGridDensity} min={1} max={2} onChange={handleDensityChange} />
        </span>
      )}
    </RecastPanel.GroupTitle>
  );
}

function SurfacesArea() {
  const {
    state: { previewMode, previewSingleSurface, previewGridDensity },
  } = useWorkbench();

  if (previewMode === 'single') {
    return (
      <div className="w-full">
        <Surface kind={previewSingleSurface} showBadge={false} />
      </div>
    );
  }

  // All-mode grid: slider value IS the column count. 1 = stacked vertically,
  // 2 = two columns. Each cell is a 16:9 frame so rows auto-size to identical
  // heights regardless of which surface (Preview/Monitor/Stage) lands in them.
  const columnCount = previewGridDensity;
  return (
    <div
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {SURFACE_ORDER.map((kind) => (
        <Surface key={kind} kind={kind} showBadge />
      ))}
    </div>
  );
}

function Surface({ kind, showBadge }: { kind: PreviewSurfaceKind; showBadge: boolean }) {
  if (kind === 'preview') return <PreviewSurface showBadge={showBadge} />;
  if (kind === 'monitor') return <MonitorSurface showBadge={showBadge} />;
  return <StageSurface showBadge={showBadge} />;
}

function PreviewSurface({ showBadge }: { showBadge: boolean }) {
  const { scene, background } = useProgramOutput();
  const checkerboard = background === 'transparent';

  return (
    <SurfaceFrame label="Preview" showLabel={showBadge} checkerboard={checkerboard}>
      <SceneStage scene={scene} surface="show" className="h-full w-full" />
    </SurfaceFrame>
  );
}

function MonitorSurface({ showBadge }: { showBadge: boolean }) {
  const { showScene } = useRenderScenes();
  // Monitor mirrors what's about to go to the audience NDI feed, so its
  // transparent-background indicator follows the audience output's alpha
  // config. With alpha on, the checker shows through wherever the scene
  // lacks an opaque fill — easier to spot transparent text/elements.
  const { state: { outputConfigs } } = useNdi();
  const checkerboard = outputConfigs.audience.withAlpha;

  return (
    <SurfaceFrame label="Monitor" showLabel={showBadge} checkerboard={checkerboard}>
      <SceneStage scene={showScene} surface="monitor" className="h-full w-full" />
    </SurfaceFrame>
  );
}

function StageSurface({ showBadge }: { showBadge: boolean }) {
  const stageScene = useStageScene();
  // Mirrors the configured alpha for the stage NDI sender so the operator
  // sees exactly what the stage feed would look like over a transparent base.
  const { state: { outputConfigs } } = useNdi();
  const checkerboard = outputConfigs.stage.withAlpha;

  return (
    <SurfaceFrame label="Stage" showLabel={showBadge} checkerboard={checkerboard}>
      <SceneStage scene={stageScene} surface="stage" className="h-full w-full" />
    </SurfaceFrame>
  );
}

// Single 16:9 frame used by every surface so grid rows auto-size to identical
// heights and the panel label (in all-mode only) can float on top instead of
// stealing a row above. In single mode the dropdown already names the surface,
// so the floating badge would be redundant.
function SurfaceFrame({ label, showLabel, checkerboard = false, children }: { label: string; showLabel: boolean; checkerboard?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: `${NDI_OUTPUT_WIDTH} / ${NDI_OUTPUT_HEIGHT}` }}
    >
      {checkerboard ? (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:24px_24px]" />
      ) : null}
      <div className="absolute inset-0">{children}</div>
      {showLabel ? (
        <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}
