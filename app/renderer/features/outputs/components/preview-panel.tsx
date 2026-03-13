import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { IconGroup } from '@renderer/components/icon-group';
import { AlignLeft } from '@renderer/components/icon/align-left';
import { Image03 } from '@renderer/components/icon/image-03';
import { LayersTwo02 } from '@renderer/components/icon/layers-two-02';
import { XCircle } from '@renderer/components/icon/x-circle';
import { LivePreview } from './live-preview';
import { ShowOverlayPanel } from './show-overlay-panel';

export function PreviewPanel() {
  const { clearLayer, clearAllLayers } = usePresentationLayers();

  function handleClearMedia() { clearLayer('media'); }
  function handleClearContent() { clearLayer('content'); }
  function handleClearOverlay() { clearLayer('overlay'); }

  return (
    <aside data-ui-region="preview-panel" className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] overflow-hidden border-l border-border-primary bg-primary">
      <LivePreview />

      <div className="border-b border-border-primary p-2">
        <IconGroup.Root fill>
          <IconGroup.Item aria-label="Clear all layers" title="Clear all layers" onClick={clearAllLayers}><XCircle /></IconGroup.Item>
          <IconGroup.Item aria-label="Clear media layer" title="Clear media layer" onClick={handleClearMedia}><Image03 /></IconGroup.Item>
          <IconGroup.Item aria-label="Clear content layer" title="Clear content layer" onClick={handleClearContent}><AlignLeft /></IconGroup.Item>
          <IconGroup.Item aria-label="Clear overlays" title="Clear overlays" onClick={handleClearOverlay}><LayersTwo02 /></IconGroup.Item>
        </IconGroup.Root>
      </div>

      <div className="min-h-0 overflow-hidden">
        <ShowOverlayPanel />
      </div>
    </aside>
  );
}
