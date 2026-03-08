import type { ReactNode } from 'react';
import { Button } from '../../../components/button';
import { OutputToggle } from '../../../features/outputs/components/output-toggle';
import { useNdi } from '../../../contexts/ndi-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { LivePreview } from './live-preview';

export function PreviewPanel() {
  const { mediaLayerAssetId, overlayLayerId, contentLayerVisible, clearLayer, clearAllLayers } = usePresentationLayers();
  const { outputState, toggleAudienceOutput } = useNdi();

  const mediaAssigned = Boolean(mediaLayerAssetId);
  const overlayAssigned = Boolean(overlayLayerId);
  const contentAssigned = contentLayerVisible;

  function handleClearAll() {
    clearAllLayers();
  }

  function handleClearMedia() {
    clearLayer('media');
  }

  function handleClearContent() {
    clearLayer('content');
  }

  function handleClearOverlay() {
    clearLayer('overlay');
  }

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] overflow-hidden border-l border-border-primary bg-background-primary_alt">
      <LivePreview />

      <div className="border-b border-border-primary p-2">
        <Button variant="danger" onClick={handleClearAll} className="w-full text-center">
          Clear All Layers
        </Button>
        <div className="mt-2 flex items-center justify-start gap-2">
          <LayerClearButton active={mediaAssigned} label="Clear media layer" icon={<MediaLayerIcon />} onClick={handleClearMedia} />
          <LayerClearButton active={contentAssigned} label="Clear content layer" icon={<ContentLayerIcon />} onClick={handleClearContent} />
          <LayerClearButton active={overlayAssigned} label="Clear overlay layer" icon={<OverlayLayerIcon />} onClick={handleClearOverlay} />
        </div>
        <div className="mt-3">
          <OutputToggle label="Audience" active={outputState.audience} onClick={toggleAudienceOutput} />
        </div>
      </div>

      <div className="min-h-0 overflow-auto p-3 text-[12px] text-text-tertiary">
        Media is rendered below content, with overlay on top.
      </div>
    </aside>
  );
}

interface LayerClearButtonProps {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

function LayerClearButton({ active, label, icon, onClick }: LayerClearButtonProps) {
  const stateClass = active
    ? 'border-brand-400/50 text-text-primary'
    : 'border-border-primary text-text-tertiary';

  return (
    <Button variant="ghost" onClick={onClick} className={`grid h-8 w-8 place-items-center p-0 ${stateClass}`}>
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function MediaLayerIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.2" strokeWidth="1.2" />
      <path d="M4.2 10.6 7 8l2.2 2.1 1.4-1.4 1.2 1.9" strokeWidth="1.2" />
    </svg>
  );
}

function ContentLayerIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <line x1="3" y1="5" x2="13" y2="5" strokeWidth="1.3" />
      <line x1="3" y1="8" x2="13" y2="8" strokeWidth="1.3" />
      <line x1="3" y1="11" x2="10" y2="11" strokeWidth="1.3" />
    </svg>
  );
}

function OverlayLayerIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden="true">
      <rect x="2.5" y="4" width="11" height="8.5" rx="1.2" strokeWidth="1.2" />
      <rect x="4.5" y="2" width="7" height="3.5" rx="0.8" strokeWidth="1.1" />
    </svg>
  );
}
