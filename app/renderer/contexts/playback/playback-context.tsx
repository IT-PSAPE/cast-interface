import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Id, MediaAsset, Overlay } from '@core/types';
import { useCast } from '../app-context';
import { useNavigation } from '../navigation-context';
import { useProjectContent } from '../use-project-content';
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
} from './overlay-playback';

// ─── Types ──────────────────────────────────────────────────────────

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

interface LayersValue {
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

interface AudioValue {
  audioAssets: MediaAsset[];
  currentAudioAsset: MediaAsset | null;
  currentAudioAssetId: Id | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  loopEnabled: boolean;
  clearAudio: () => void;
  pause: () => void;
  play: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  selectAudio: (assetId: Id) => void;
  toggleLoop: () => void;
  togglePlayback: () => void;
}

interface PlaybackContextValue {
  layers: LayersValue;
  audio: AudioValue;
}

// ─── Constants ──────────────────────────────────────────────────────

const OVERLAY_PLAYBACK_INTERVAL_MS = 33;
const PlaybackContext = createContext<PlaybackContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const { setStatusText } = useCast();
  const { currentOutputDeckItemId, outputArmVersion, clearOutputDeckItem } = useNavigation();
  const { mediaAssets, mediaAssetsById, overlaysById } = useProjectContent();

  // ── Presentation layers ──

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
    return () => { window.clearInterval(intervalId); };
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

  const layers = useMemo<LayersValue>(() => ({
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
  }), [
    activateOverlay, activeOverlayIds, activeOverlays, clearAllLayers, clearAllOverlays,
    clearLayer, clearOverlay, contentLayerVisible, mediaLayerAsset, mediaLayerAssetId,
    overlayMode, setMediaLayerAsset, setOverlayMode, showContentLayer,
  ]);

  // ── Audio playback ──

  const audioAssets = useMemo(() => mediaAssets.filter((asset) => asset.type === 'audio'), [mediaAssets]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  if (!audioElementRef.current) {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audioElementRef.current = audio;
  }

  const [currentAudioAssetId, setCurrentAudioAssetId] = useState<Id | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentAudioAsset = useMemo(() => {
    if (!currentAudioAssetId) return audioAssets[0] ?? null;
    return audioAssets.find((asset) => asset.id === currentAudioAssetId) ?? audioAssets[0] ?? null;
  }, [audioAssets, currentAudioAssetId]);

  const syncAudioSource = useCallback((asset: MediaAsset | null, autoplay: boolean, resetPosition: boolean) => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;

    if (!asset) {
      audioEl.pause();
      audioEl.removeAttribute('src');
      delete audioEl.dataset.assetId;
      delete audioEl.dataset.assetSrc;
      audioEl.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const sourceChanged = audioEl.dataset.assetId !== asset.id || audioEl.dataset.assetSrc !== asset.src;
    if (sourceChanged) {
      audioEl.pause();
      audioEl.src = asset.src;
      audioEl.dataset.assetId = asset.id;
      audioEl.dataset.assetSrc = asset.src;
      audioEl.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (resetPosition) {
      audioEl.currentTime = 0;
      setCurrentTime(0);
    }

    if (autoplay) {
      void audioEl.play().catch(() => { setIsPlaying(false); });
      return;
    }

    audioEl.pause();
    setIsPlaying(false);
  }, []);

  const resolveAudioById = useCallback((assetId: Id | null) => {
    if (!assetId) return audioAssets[0] ?? null;
    return audioAssets.find((asset) => asset.id === assetId) ?? audioAssets[0] ?? null;
  }, [audioAssets]);

  const selectAudio = useCallback((assetId: Id) => {
    const nextAsset = resolveAudioById(assetId);
    setCurrentAudioAssetId(nextAsset?.id ?? null);
    syncAudioSource(nextAsset, isPlaying, true);
  }, [isPlaying, resolveAudioById, syncAudioSource]);

  const playAudio = useCallback(() => {
    const nextAsset = currentAudioAsset ?? audioAssets[0] ?? null;
    if (!nextAsset) return;
    setCurrentAudioAssetId(nextAsset.id);
    syncAudioSource(nextAsset, true, false);
  }, [audioAssets, currentAudioAsset, syncAudioSource]);

  const pauseAudio = useCallback(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;
    audioEl.pause();
    setIsPlaying(false);
  }, []);

  const playAdjacent = useCallback((direction: 1 | -1) => {
    if (audioAssets.length === 0) return;
    const currentIndex = currentAudioAsset ? audioAssets.findIndex((asset) => asset.id === currentAudioAsset.id) : -1;
    const safeIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + audioAssets.length) % audioAssets.length;
    const nextAsset = audioAssets[nextIndex] ?? null;
    if (!nextAsset) return;
    setCurrentAudioAssetId(nextAsset.id);
    syncAudioSource(nextAsset, true, true);
  }, [audioAssets, currentAudioAsset, syncAudioSource]);

  const playPrevious = useCallback(() => { playAdjacent(-1); }, [playAdjacent]);
  const playNext = useCallback(() => { playAdjacent(1); }, [playAdjacent]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) { pauseAudio(); return; }
    playAudio();
  }, [isPlaying, pauseAudio, playAudio]);

  const toggleLoop = useCallback(() => {
    setLoopEnabled((current) => !current);
  }, []);

  const seekTo = useCallback((time: number) => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;
    const nextTime = Number.isFinite(time) ? Math.min(Math.max(time, 0), Number.isFinite(audioEl.duration) ? audioEl.duration : time) : 0;
    audioEl.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const clearAudio = useCallback(() => {
    const firstAsset = audioAssets[0] ?? null;
    setCurrentAudioAssetId(firstAsset?.id ?? null);
    syncAudioSource(firstAsset, false, true);
  }, [audioAssets, syncAudioSource]);

  // Audio element event listeners
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;

    function handleTimeUpdate() { setCurrentTime(audioEl!.currentTime); }
    function handleLoadedMetadata() { setDuration(Number.isFinite(audioEl!.duration) ? audioEl!.duration : 0); }
    function handlePlay() { setIsPlaying(true); }
    function handlePause() { setIsPlaying(false); }
    function handleEnded() { setIsPlaying(false); setCurrentTime(0); }

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('ended', handleEnded);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
    };
  }, []);

  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;
    audioEl.loop = loopEnabled;
  }, [loopEnabled]);

  useEffect(() => {
    if (audioAssets.length === 0) {
      syncAudioSource(null, false, true);
      if (currentAudioAssetId !== null) setCurrentAudioAssetId(null);
      return;
    }
    if (currentAudioAssetId && audioAssets.some((asset) => asset.id === currentAudioAssetId)) return;
    const firstAsset = audioAssets[0];
    setCurrentAudioAssetId(firstAsset.id);
    syncAudioSource(firstAsset, false, true);
  }, [audioAssets, currentAudioAssetId, syncAudioSource]);

  useEffect(() => {
    if (!currentAudioAsset) return;
    syncAudioSource(currentAudioAsset, isPlaying, false);
  }, [currentAudioAsset, isPlaying, syncAudioSource]);

  const audio = useMemo<AudioValue>(() => ({
    audioAssets,
    currentAudioAsset,
    currentAudioAssetId: currentAudioAsset?.id ?? null,
    currentTime,
    duration,
    isPlaying,
    loopEnabled,
    clearAudio,
    pause: pauseAudio,
    play: playAudio,
    playNext,
    playPrevious,
    seekTo,
    selectAudio,
    toggleLoop,
    togglePlayback,
  }), [audioAssets, clearAudio, currentAudioAsset, currentTime, duration, isPlaying, loopEnabled, pauseAudio, playAudio, playNext, playPrevious, seekTo, selectAudio, toggleLoop, togglePlayback]);

  // ── Combined value ──

  const value = useMemo<PlaybackContextValue>(() => ({ layers, audio }), [layers, audio]);

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
}

export function usePresentationLayers(): LayersValue {
  return usePlayback().layers;
}

export function useAudio(): AudioValue {
  return usePlayback().audio;
}

// ─── Utils ──────────────────────────────────────────────────────────

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
