import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Id, MediaAsset, Overlay } from '@core/types';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useProjectContent } from './use-project-content';
import {
  activateOverlayPlayback,
  advanceOverlayPlayback,
  clearAllOverlayPlayback,
  clearOverlayPlayback,
  collapseOverlayPlaybackToSingle,
  getOverlayRenderLayers,
  type ActiveOverlayEntry,
  type OverlayPlaybackMode,
  type OverlayPlaybackState,
} from './overlay-editor/overlay-playback';

export type PresentationLayerKey = 'media' | 'content' | 'overlay';

export interface ActiveOverlayPlayback {
  overlayId: Id;
  overlay: Overlay;
  opacityMultiplier: number;
  name: string;
  state: OverlayPlaybackState;
  remainingAutoClearMs: number | null;
  stackOrder: number;
}

interface PresentationLayerContextValue {
  mediaLayerAssetId: Id | null;
  overlayMode: OverlayPlaybackMode;
  activeOverlays: ActiveOverlayPlayback[];
  activeOverlayIds: Id[];
  contentLayerVisible: boolean;
  mediaLayerAsset: MediaAsset | null;
  setMediaLayerAsset: (assetId: Id) => void;
  activateOverlay: (overlayId: Id) => void;
  clearOverlay: (overlayId: Id) => void;
  setOverlayMode: (mode: OverlayPlaybackMode) => void;
  showContentLayer: () => void;
  clearLayer: (layer: PresentationLayerKey) => void;
  clearAllOverlays: () => void;
  clearAllLayers: () => void;
}

const OVERLAY_PLAYBACK_INTERVAL_MS = 33;

const PresentationLayerContext = createContext<PresentationLayerContextValue | null>(null);

export function PresentationLayerProvider({ children }: { children: ReactNode }) {
  const { setStatusText } = useCast();
  const { currentOutputDeckItemId, outputArmVersion, clearOutputDeckItem } = useNavigation();
  const { mediaAssetsById, overlaysById } = useProjectContent();

  const [mediaLayerAssetId, setMediaLayerAssetId] = useState<Id | null>(null);
  const [contentLayerVisible, setContentLayerVisible] = useState(true);
  const [overlayMode, setOverlayModeState] = useState<OverlayPlaybackMode>('single');
  const [overlayEntries, setOverlayEntries] = useState<ActiveOverlayEntry[]>([]);
  const [playbackNow, setPlaybackNow] = useState(() => Date.now());

  useEffect(() => {
    if (!currentOutputDeckItemId) return;
    setContentLayerVisible(true);
  }, [currentOutputDeckItemId, outputArmVersion]);

  useEffect(() => {
    const hasMedia = mediaLayerAssetId ? mediaAssetsById.has(mediaLayerAssetId) : false;
    if (!hasMedia) setMediaLayerAssetId(null);
  }, [mediaAssetsById, mediaLayerAssetId]);

  useEffect(() => {
    if (overlayEntries.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      setPlaybackNow(Date.now());
    }, OVERLAY_PLAYBACK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [overlayEntries.length]);

  useEffect(() => {
    setOverlayEntries((current) => {
      const next = advanceOverlayPlayback(current, overlaysById, playbackNow);
      return overlayEntriesEqual(current, next) ? current : next;
    });
  }, [overlaysById, playbackNow]);

  const mediaLayerAsset = useMemo(() => {
    if (!mediaLayerAssetId) return null;
    return mediaAssetsById.get(mediaLayerAssetId) ?? null;
  }, [mediaAssetsById, mediaLayerAssetId]);

  const activeOverlayLayers = useMemo(
    () => getOverlayRenderLayers(overlayEntries, overlaysById, playbackNow),
    [overlayEntries, overlaysById, playbackNow],
  );

  const activeOverlays = useMemo<ActiveOverlayPlayback[]>(() => {
    return activeOverlayLayers.map((layer) => ({
      overlayId: layer.overlayId,
      overlay: layer.overlay,
      opacityMultiplier: layer.opacityMultiplier,
      name: layer.overlay.name,
      state: layer.state,
      remainingAutoClearMs: layer.remainingAutoClearMs,
      stackOrder: layer.stackOrder,
    }));
  }, [activeOverlayLayers]);

  const activeOverlayIds = useMemo(() => activeOverlays.map((overlay) => overlay.overlayId), [activeOverlays]);

  const setMediaLayerAsset = useCallback((assetId: Id) => {
    const asset = mediaAssetsById.get(assetId);
    if (!asset) return;
    setMediaLayerAssetId(asset.id);
    setStatusText(`Media layer: ${asset.name}`);
  }, [mediaAssetsById, setStatusText]);

  const activateOverlay = useCallback((overlayId: Id) => {
    const overlay = overlaysById.get(overlayId);
    if (!overlay) return;
    const now = Date.now();
    setPlaybackNow(now);
    setOverlayEntries((current) => activateOverlayPlayback(current, overlaysById, overlayId, overlayMode, now));
    setStatusText(`Overlay: ${overlay.name}`);
  }, [overlayMode, overlaysById, setStatusText]);

  const clearOverlay = useCallback((overlayId: Id) => {
    const overlay = overlaysById.get(overlayId);
    if (!overlay) return;
    const now = Date.now();
    setPlaybackNow(now);
    setOverlayEntries((current) => clearOverlayPlayback(current, overlaysById, overlayId, now));
    setStatusText(`Overlay cleared: ${overlay.name}`);
  }, [overlaysById, setStatusText]);

  const setOverlayMode = useCallback((mode: OverlayPlaybackMode) => {
    const now = Date.now();
    setPlaybackNow(now);
    setOverlayModeState(mode);
    if (mode === 'single') {
      setOverlayEntries((current) => collapseOverlayPlaybackToSingle(current, overlaysById, now));
    }
    setStatusText(mode === 'single' ? 'Overlay mode: single' : 'Overlay mode: multiple');
  }, [overlaysById, setStatusText]);

  const clearAllOverlays = useCallback(() => {
    const now = Date.now();
    setPlaybackNow(now);
    setOverlayEntries((current) => clearAllOverlayPlayback(current, overlaysById, now));
    setStatusText('All overlays cleared');
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

    const now = Date.now();
    setPlaybackNow(now);
    setOverlayEntries((current) => clearAllOverlayPlayback(current, overlaysById, now));
    setStatusText('Overlay layer cleared');
  }, [overlaysById, setStatusText]);

  const clearAllLayers = useCallback(() => {
    setMediaLayerAssetId(null);
    setContentLayerVisible(false);
    setOverlayEntries([]);
    clearOutputDeckItem();
    setStatusText('All layers cleared');
  }, [clearOutputDeckItem, setStatusText]);

  const value = useMemo<PresentationLayerContextValue>(
    () => ({
      mediaLayerAssetId,
      overlayMode,
      activeOverlays,
      activeOverlayIds,
      contentLayerVisible,
      mediaLayerAsset,
      setMediaLayerAsset,
      activateOverlay,
      clearOverlay,
      setOverlayMode,
      showContentLayer,
      clearLayer,
      clearAllOverlays,
      clearAllLayers,
    }),
    [
      activateOverlay,
      activeOverlayIds,
      activeOverlays,
      clearAllLayers,
      clearAllOverlays,
      clearLayer,
      contentLayerVisible,
      mediaLayerAsset,
      mediaLayerAssetId,
      overlayMode,
      setMediaLayerAsset,
      setOverlayMode,
      showContentLayer,
      clearOverlay,
    ],
  );

  return <PresentationLayerContext.Provider value={value}>{children}</PresentationLayerContext.Provider>;
}

export function usePresentationLayers(): PresentationLayerContextValue {
  const ctx = useContext(PresentationLayerContext);
  if (!ctx) throw new Error('usePresentationLayers must be used within PresentationLayerProvider');
  return ctx;
}

function overlayEntriesEqual(left: ActiveOverlayEntry[], right: ActiveOverlayEntry[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((entry, index) => {
    const other = right[index];
    return Boolean(other)
      && entry.overlayId === other.overlayId
      && entry.state === other.state
      && entry.startedAt === other.startedAt
      && entry.exitStartedAt === other.exitStartedAt
      && entry.exitStartOpacity === other.exitStartOpacity
      && entry.stackOrder === other.stackOrder
      && entry.autoClearAt === other.autoClearAt;
  });
}
