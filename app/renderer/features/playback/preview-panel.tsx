import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import { AlignLeft, Image, Layers, Layers2, Plus, VolumeX, XCircle } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SceneFrame } from '../../components/display/scene-frame';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { Panel } from '../../components/layout/panel';
import { IconGroup } from '@renderer/components/icon-group';
import { useNavigation } from '../../contexts/navigation-context';
import { useOverlayEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useAudio, usePresentationLayers } from '../../contexts/playback/playback-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { useGridSize } from '../../hooks/use-grid-size';
import { OverlayBinPanel } from '../assets/overlays/overlay-bin-panel';
import { useProgramOutput } from './use-program-output';
import { SceneStage } from '../canvas/scene-stage';

export function PreviewPanel() {
  const { clearLayer, clearAllLayers, mediaLayerAsset, contentLayerVisible, activeOverlays, overlayMode, setOverlayMode } = usePresentationLayers();
  const { currentOutputDeckItemId } = useNavigation();
  const audio = useAudio();
  const { scene, background } = useProgramOutput();
  const { createOverlay } = useOverlayEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { gridSize, setGridSize, min, max } = useGridSize('recast.grid-size.overlay-bin', 3, 2, 4);
  const mediaActive = Boolean(mediaLayerAsset);
  const contentActive = contentLayerVisible && Boolean(currentOutputDeckItemId);
  const overlayActive = activeOverlays.length > 0;
  const audioActive = audio.isPlaying || audio.currentTime > 0;
  const checkerboard = background === 'transparent';
  const stageClassName = checkerboard ? 'bg-transparent' : 'bg-black';

  function handleClearMedia() { clearLayer('media'); }
  function handleClearContent() { clearLayer('content'); }
  function handleClearOverlay() { clearLayer('overlay'); }
  function handleClearAudio() { audio.clearAudio(); }
  function handleClearAll() {
    audio.clearAudio();
    clearAllLayers();
  }

  function handleModeToggle() {
    setOverlayMode(overlayMode === 'single' ? 'multiple' : 'single');
  }

  function handleCreateOverlay() {
    void createOverlay().then(() => {
      setWorkbenchMode('overlay-editor');
    });
  }

  const modeLabel = overlayMode === 'single' ? 'Single overlay mode — click to allow multiple' : 'Multiple overlay mode — click for single';

  return (
    <aside data-ui-region="preview-panel" className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden border-l border-primary bg-primary">
      <div>
        <div className="relative border-b border-primary bg-secondary">
          <SceneFrame
            width={NDI_OUTPUT_WIDTH}
            height={NDI_OUTPUT_HEIGHT}
            checkerboard={checkerboard}
            stageClassName={stageClassName}
          >
            <SceneStage
              scene={scene}
              surface="show"
              className="h-full w-full"
            />
          </SceneFrame>
        </div>
        <div className="border-b border-primary p-[1px]">
          <IconGroup.Root fill className='rounded-none' >
            <IconGroup.Item aria-label="Clear all layers" title="Clear all layers" onClick={handleClearAll}><XCircle className="size-4" /></IconGroup.Item>
            <IconGroup.Item active={mediaActive} aria-label="Clear media layer" title="Clear media layer" onClick={handleClearMedia}><Image className="size-4" /></IconGroup.Item>
            <IconGroup.Item active={contentActive} aria-label="Clear content layer" title="Clear content layer" onClick={handleClearContent}><AlignLeft className="size-4" /></IconGroup.Item>
            <IconGroup.Item active={overlayActive} aria-label="Clear overlays" title="Clear overlays" onClick={handleClearOverlay}><Layers2 className="size-4" /></IconGroup.Item>
            <IconGroup.Item active={audioActive} aria-label="Clear audio" title="Clear audio" onClick={handleClearAudio}><VolumeX className="size-4" /></IconGroup.Item>
          </IconGroup.Root>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden">
        <section className="flex h-full min-h-0 flex-col overflow-hidden">
          <Panel.Header>
            <span className="text-sm font-medium text-primary mr-auto">Overlays</span>
            <Button.Icon label={modeLabel} variant="ghost" onClick={handleModeToggle}>
              {overlayMode === 'single' ? <Layers/> : <Layers2/>}
            </Button.Icon>
            <Button.Icon label="Add overlay" onClick={handleCreateOverlay}>
              <Plus/>
            </Button.Icon>
          </Panel.Header>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            <OverlayBinPanel filterText="" gridItemSize={gridSize} />
          </div>
          <div className="flex items-center justify-end border-t border-primary px-2 py-1">
            <GridSizeSlider value={gridSize} min={min} max={max} onChange={setGridSize} />
          </div>
        </section>
      </div>
    </aside>
  );
}
