import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Id, MediaAsset, Overlay } from '@core/types';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';

export type PresentationLayerKey = 'media' | 'content' | 'overlay';

interface PresentationLayerContextValue {
  mediaLayerAssetId: Id | null;
  overlayLayerId: Id | null;
  contentLayerVisible: boolean;
  mediaLayerAsset: MediaAsset | null;
  overlayLayer: Overlay | null;
  setMediaLayerAsset: (assetId: Id) => void;
  setOverlayLayer: (overlayId: Id) => void;
  showContentLayer: () => void;
  clearLayer: (layer: PresentationLayerKey) => void;
  clearAllLayers: () => void;
}

const PresentationLayerContext = createContext<PresentationLayerContextValue | null>(null);

export function PresentationLayerProvider({ children }: { children: ReactNode }) {
  const { setStatusText } = useCast();
  const { activeBundle, currentPresentationId } = useNavigation();

  const [mediaLayerAssetId, setMediaLayerAssetId] = useState<Id | null>(null);
  const [overlayLayerId, setOverlayLayerId] = useState<Id | null>(null);
  const [contentLayerVisible, setContentLayerVisible] = useState(true);

  useEffect(() => {
    setContentLayerVisible(true);
  }, [currentPresentationId]);

  useEffect(() => {
    if (!activeBundle) {
      setMediaLayerAssetId(null);
      setOverlayLayerId(null);
      return;
    }

    const hasMedia = mediaLayerAssetId && activeBundle.mediaAssets.some((asset) => asset.id === mediaLayerAssetId);
    if (!hasMedia) setMediaLayerAssetId(null);

    const hasOverlay = overlayLayerId && activeBundle.overlays.some((overlay) => overlay.id === overlayLayerId);
    if (!hasOverlay) setOverlayLayerId(null);
  }, [activeBundle, mediaLayerAssetId, overlayLayerId]);

  const mediaLayerAsset = useMemo(() => {
    if (!activeBundle || !mediaLayerAssetId) return null;
    return activeBundle.mediaAssets.find((asset) => asset.id === mediaLayerAssetId) ?? null;
  }, [activeBundle, mediaLayerAssetId]);

  const overlayLayer = useMemo(() => {
    if (!activeBundle || !overlayLayerId) return null;
    return activeBundle.overlays.find((overlay) => overlay.id === overlayLayerId) ?? null;
  }, [activeBundle, overlayLayerId]);

  const setMediaLayerAsset = useCallback((assetId: Id) => {
    if (!activeBundle) return;
    const asset = activeBundle.mediaAssets.find((item) => item.id === assetId);
    if (!asset) return;
    setMediaLayerAssetId(asset.id);
    setStatusText(`Media layer: ${asset.name}`);
  }, [activeBundle, setStatusText]);

  const setOverlayLayer = useCallback((overlayId: Id) => {
    if (!activeBundle) return;
    const overlay = activeBundle.overlays.find((item) => item.id === overlayId);
    if (!overlay) return;
    setOverlayLayerId(overlay.id);
    setStatusText(`Overlay layer: ${overlay.name}`);
  }, [activeBundle, setStatusText]);

  const showContentLayer = useCallback(() => {
    setContentLayerVisible(true);
  }, []);

  const clearLayer = useCallback((layer: PresentationLayerKey) => {
    if (layer === 'media') {
      setMediaLayerAssetId(null);
      setStatusText('Media layer cleared');
      return;
    }

    if (layer === 'content') {
      setContentLayerVisible(false);
      setStatusText('Content layer cleared');
      return;
    }

    setOverlayLayerId(null);
    setStatusText('Overlay layer cleared');
  }, [setStatusText]);

  const clearAllLayers = useCallback(() => {
    setMediaLayerAssetId(null);
    setContentLayerVisible(false);
    setOverlayLayerId(null);
    setStatusText('All layers cleared');
  }, [setStatusText]);

  const value = useMemo<PresentationLayerContextValue>(
    () => ({
      mediaLayerAssetId,
      overlayLayerId,
      contentLayerVisible,
      mediaLayerAsset,
      overlayLayer,
      setMediaLayerAsset,
      setOverlayLayer,
      showContentLayer,
      clearLayer,
      clearAllLayers,
    }),
    [mediaLayerAssetId, overlayLayerId, contentLayerVisible, mediaLayerAsset, overlayLayer,
     setMediaLayerAsset, setOverlayLayer, showContentLayer, clearLayer, clearAllLayers],
  );

  return <PresentationLayerContext.Provider value={value}>{children}</PresentationLayerContext.Provider>;
}

export function usePresentationLayers(): PresentationLayerContextValue {
  const ctx = useContext(PresentationLayerContext);
  if (!ctx) throw new Error('usePresentationLayers must be used within PresentationLayerProvider');
  return ctx;
}
