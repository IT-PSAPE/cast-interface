import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { IconGroup } from '@renderer/components/icon-group';
import { AlignLeft } from '@renderer/components/icon/align-left';
import { Image03 } from '@renderer/components/icon/image-03';
import { LayersTwo02 } from '@renderer/components/icon/layers-two-02';
import { VolumeX } from '@renderer/components/icon/volume-x';
import { XCircle } from '@renderer/components/icon/x-circle';
import { useShowAudio } from '../contexts/show-audio-context';
import { LivePreview } from './live-preview';
import { ShowPlaybackPanel } from './show-playback-panel';

export function PreviewPanel() {
  const { clearLayer, clearAllLayers, mediaLayerAsset, contentLayerVisible, activeOverlays } = usePresentationLayers();
  const { currentOutputContentItemId } = useNavigation();
  const { clearCurrentSlideSelection } = useSlides();
  const { actions: audioActions, state: audioState } = useShowAudio();
  const mediaActive = Boolean(mediaLayerAsset);
  const contentActive = contentLayerVisible && Boolean(currentOutputContentItemId);
  const overlayActive = activeOverlays.length > 0;
  const audioActive = audioState.isPlaying || audioState.currentTime > 0;

  function handleClearMedia() { clearLayer('media'); }
  function handleClearContent() { clearLayer('content'); }
  function handleClearOverlay() { clearLayer('overlay'); }
  function handleClearAudio() { audioActions.clearAudio(); }
  function handleClearAll() {
    audioActions.clearAudio();
    clearAllLayers();
    clearCurrentSlideSelection();
  }

  return (
    <aside data-ui-region="preview-panel" className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden border-l border-border-primary bg-primary">
      <div>
        <LivePreview />
        <div className="border-b border-border-primary p-[1px]">
          <IconGroup.Root fill >
            <IconGroup.Item aria-label="Clear all layers" title="Clear all layers" onClick={handleClearAll}><XCircle /></IconGroup.Item>
            <IconGroup.Item active={mediaActive} aria-label="Clear media layer" title="Clear media layer" onClick={handleClearMedia}><Image03 /></IconGroup.Item>
            <IconGroup.Item active={contentActive} aria-label="Clear content layer" title="Clear content layer" onClick={handleClearContent}><AlignLeft /></IconGroup.Item>
            <IconGroup.Item active={overlayActive} aria-label="Clear overlays" title="Clear overlays" onClick={handleClearOverlay}><LayersTwo02 /></IconGroup.Item>
            <IconGroup.Item active={audioActive} aria-label="Clear audio" title="Clear audio" onClick={handleClearAudio}><VolumeX /></IconGroup.Item>
          </IconGroup.Root>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden">
        <ShowPlaybackPanel />
      </div>
    </aside>
  );
}
