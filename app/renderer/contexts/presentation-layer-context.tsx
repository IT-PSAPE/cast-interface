import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Id, MediaAsset, Overlay } from '@core/types';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useProjectContent } from './use-project-content';

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
  const { currentPlaylistPresentationId } = useNavigation();
  const { mediaAssetsById, overlaysById } = useProjectContent();

  const [mediaLayerAssetId, setMediaLayerAssetId] = useState<Id | null>(null);
  const [overlayLayerId, setOverlayLayerId] = useState<Id | null>(null);
  const [contentLayerVisible, setContentLayerVisible] = useState(true);

  useEffect(() => {
    setContentLayerVisible(true);
  }, [currentPlaylistPresentationId]);

  useEffect(() => {
    const hasMedia = mediaLayerAssetId ? mediaAssetsById.has(mediaLayerAssetId) : false;
    if (!hasMedia) setMediaLayerAssetId(null);

    const hasOverlay = overlayLayerId ? overlaysById.has(overlayLayerId) : false;
    if (!hasOverlay) setOverlayLayerId(null);
  }, [mediaAssetsById, mediaLayerAssetId, overlayLayerId, overlaysById]);

  const mediaLayerAsset = useMemo(() => {
    if (!mediaLayerAssetId) return null;
    return mediaAssetsById.get(mediaLayerAssetId) ?? null;
  }, [mediaAssetsById, mediaLayerAssetId]);

  const overlayLayer = useMemo(() => {
    if (!overlayLayerId) return null;
    return overlaysById.get(overlayLayerId) ?? null;
  }, [overlayLayerId, overlaysById]);

  const setMediaLayerAsset = useCallback((assetId: Id) => {
    const asset = mediaAssetsById.get(assetId);
    if (!asset) return;
    setMediaLayerAssetId(asset.id);
    setStatusText(`Media layer: ${asset.name}`);
  }, [mediaAssetsById, setStatusText]);

  const setOverlayLayer = useCallback((overlayId: Id) => {
    const overlay = overlaysById.get(overlayId);
    if (!overlay) return;
    setOverlayLayerId(overlay.id);
    setStatusText(`Overlay layer: ${overlay.name}`);
  }, [overlaysById, setStatusText]);

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
