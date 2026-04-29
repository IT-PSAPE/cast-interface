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
  getNextOverlayPlaybackDelay,
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

interface PresentationMediaLayerValue {
  mediaLayerAssetId: Id | null;
  mediaLayerAsset: MediaAsset | null;
  setMediaLayerAsset: (assetId: Id) => void;
}

interface PresentationOverlayLayerValue {
  overlayMode: OverlayPlaybackMode;
  activeOverlays: ActiveOverlayPlayback[];
  activeOverlayIds: Id[];
  activateOverlay: (overlayId: Id) => void;
  clearOverlay: (overlayId: Id) => void;
  setOverlayMode: (mode: OverlayPlaybackMode) => void;
  clearAllOverlays: () => void;
}

interface PresentationRenderLayerValue {
  contentLayerVisible: boolean;
  mediaLayerAsset: MediaAsset | null;
  activeOverlays: ActiveOverlayPlayback[];
}

interface PresentationLayerActionsValue {
  showContentLayer: () => void;
  clearLayer: (layer: PresentationLayerKey) => void;
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
  armAudio: (assetId: Id) => void;
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

interface StageValue {
  currentStageId: Id | null;
  setCurrentStageId: (id: Id | null) => void;
}

interface PlaybackContextValue {
  layers: LayersValue;
  audio: AudioValue;
  stage: StageValue;
}

// ─── Constants ──────────────────────────────────────────────────────

const PlaybackContext = createContext<PlaybackContextValue | null>(null);
const PresentationLayersContext = createContext<LayersValue | null>(null);
const PresentationMediaLayerContext = createContext<PresentationMediaLayerValue | null>(null);
const PresentationOverlayLayerContext = createContext<PresentationOverlayLayerValue | null>(null);
const PresentationRenderLayerContext = createContext<PresentationRenderLayerValue | null>(null);
const PresentationLayerActionsContext = createContext<PresentationLayerActionsValue | null>(null);
const AudioPlaybackContext = createContext<AudioValue | null>(null);
const StagePlaybackContext = createContext<StageValue | null>(null);

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
    const delay = getNextOverlayPlaybackDelay(overlayEntries, overlaysById, playbackNow);
    if (delay == null) return undefined;
    const timeoutId = window.setTimeout(() => {
      setPlaybackNow(Date.now());
    }, Math.max(0, delay));
    return () => { window.clearTimeout(timeoutId); };
  }, [overlayEntries, overlaysById, playbackNow]);

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
      clearOutputDeckItem();
      setStatusText('Content layer cleared');
      return;
    }
    const now = Date.now();
    setPlaybackNow(now);
    setOverlayEntries((current) => clearAllOverlayPlayback(current, overlaysById, now));
    setStatusText('Overlay layer cleared');
  }, [clearOutputDeckItem, overlaysById, setStatusText]);

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

  const mediaLayer = useMemo<PresentationMediaLayerValue>(() => ({
    mediaLayerAssetId,
    mediaLayerAsset,
    setMediaLayerAsset,
  }), [mediaLayerAsset, mediaLayerAssetId, setMediaLayerAsset]);

  const overlayLayer = useMemo<PresentationOverlayLayerValue>(() => ({
    overlayMode,
    activeOverlays,
    activeOverlayIds,
    activateOverlay,
    clearOverlay,
    setOverlayMode,
    clearAllOverlays,
  }), [activateOverlay, activeOverlayIds, activeOverlays, clearAllOverlays, clearOverlay, overlayMode, setOverlayMode]);

  const renderLayer = useMemo<PresentationRenderLayerValue>(() => ({
    contentLayerVisible,
    mediaLayerAsset,
    activeOverlays,
  }), [activeOverlays, contentLayerVisible, mediaLayerAsset]);

  const layerActions = useMemo<PresentationLayerActionsValue>(() => ({
    showContentLayer,
    clearLayer,
    clearAllLayers,
  }), [clearAllLayers, clearLayer, showContentLayer]);

  // ── Audio playback ──
  //
  // State-as-source-of-truth model:
  //  * `currentAudioAssetId` and `requestedPlay` declare the user's intent.
  //  * Effects synchronize the <audio> element to match that intent.
  //  * Audio events (timeupdate, durationchange, ended, error) update derived
  //    state (`currentTime`, `duration`) and revoke `requestedPlay` only on
  //    natural end / failure — never to mirror our own pause()/play() calls,
  //    which is what caused the previous play/pause oscillation.

  const audioAssets = useMemo(() => mediaAssets.filter((asset) => asset.type === 'audio'), [mediaAssets]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [currentAudioAssetId, setCurrentAudioAssetId] = useState<Id | null>(null);
  const [requestedPlay, setRequestedPlay] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentAudioAsset = useMemo(() => {
    if (!currentAudioAssetId) return null;
    return audioAssets.find((asset) => asset.id === currentAudioAssetId) ?? null;
  }, [audioAssets, currentAudioAssetId]);

  const isPlaying = requestedPlay && currentAudioAsset !== null;

  // Mount the <audio> element + listeners exactly once per provider lifecycle.
  // Creating it inside the effect (rather than in the render body) keeps
  // remount cleanup honest: the cleanup runs, the ref is nulled, and the next
  // mount gets a fresh element instead of reusing one we already tore down.
  useEffect(() => {
    const audioEl = document.createElement('audio');
    audioEl.preload = 'auto';
    audioElementRef.current = audioEl;

    function handleTimeUpdate() { setCurrentTime(audioEl.currentTime); }
    function handleDurationChange() {
      setDuration(Number.isFinite(audioEl.duration) ? audioEl.duration : 0);
    }
    function handleEnded() {
      // Browser handles native looping when `audioEl.loop` is true, so we
      // only see 'ended' for natural finishes.
      setRequestedPlay(false);
      setCurrentTime(0);
    }
    function handleError() {
      console.error('[Audio] Element error:', audioEl.error);
      setRequestedPlay(false);
    }

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('durationchange', handleDurationChange);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('error', handleError);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('durationchange', handleDurationChange);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('error', handleError);
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
      audioElementRef.current = null;
    };
  }, []);

  // Sync the <audio> src to the armed asset. Keyed by the *id* (primitive) so
  // a snapshot churn that produces a new asset object reference but the same
  // id doesn't cause us to re-set src.
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;

    if (!currentAudioAssetId) {
      if (audioEl.dataset.assetId) {
        audioEl.pause();
        audioEl.removeAttribute('src');
        delete audioEl.dataset.assetId;
        audioEl.load();
        setCurrentTime(0);
        setDuration(0);
      }
      return;
    }

    const asset = audioAssets.find((a) => a.id === currentAudioAssetId);
    if (!asset) return;
    if (audioEl.dataset.assetId === asset.id) return;

    audioEl.pause();
    audioEl.src = asset.src;
    audioEl.dataset.assetId = asset.id;
    audioEl.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
  }, [audioAssets, currentAudioAssetId]);

  // Sync play/pause to the user's intent. Only ever calls play() or pause()
  // when the element is in the opposite state, so it can't fight itself.
  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;
    if (!currentAudioAssetId) return;

    if (requestedPlay && audioEl.paused) {
      void audioEl.play().catch((error: unknown) => {
        // AbortError fires when a subsequent src change or pause() interrupts
        // a play in progress. The user's intent isn't violated — the new state
        // will run its own play() — so don't unilaterally clear requestedPlay.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('[Audio] Play failed:', error);
        setRequestedPlay(false);
      });
    } else if (!requestedPlay && !audioEl.paused) {
      audioEl.pause();
    }
  }, [requestedPlay, currentAudioAssetId]);

  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;
    audioEl.loop = loopEnabled;
  }, [loopEnabled]);

  // Cleanup-only: if the currently armed asset disappears from the project
  // (deleted, filtered out, etc.), null out our state. The src-sync effect
  // above will then tear the source off the element on the next render.
  useEffect(() => {
    if (!currentAudioAssetId) return;
    if (audioAssets.some((asset) => asset.id === currentAudioAssetId)) return;
    setCurrentAudioAssetId(null);
    setRequestedPlay(false);
  }, [audioAssets, currentAudioAssetId]);

  // ── Public actions ─────────────────────────────────────────────
  // Each action only updates state. The effects above translate intent into
  // <audio> element calls, exactly once per state transition.

  const armAudio = useCallback((assetId: Id) => {
    const asset = audioAssets.find((a) => a.id === assetId);
    if (!asset) return;
    setCurrentAudioAssetId(asset.id);
    setRequestedPlay(true);
    setStatusText(`Audio: ${asset.name}`);
  }, [audioAssets, setStatusText]);

  const selectAudio = useCallback((assetId: Id) => {
    const asset = audioAssets.find((a) => a.id === assetId);
    if (!asset) return;
    setCurrentAudioAssetId(asset.id);
    // Intentionally does not change `requestedPlay` — switching tracks while
    // playing keeps playing; while paused, stays paused.
  }, [audioAssets]);

  const playAudio = useCallback(() => {
    if (!currentAudioAssetId) return;
    setRequestedPlay(true);
  }, [currentAudioAssetId]);

  const pauseAudio = useCallback(() => {
    setRequestedPlay(false);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!currentAudioAssetId) return;
    setRequestedPlay((prev) => !prev);
  }, [currentAudioAssetId]);

  const playAdjacent = useCallback((direction: 1 | -1) => {
    if (!currentAudioAssetId || audioAssets.length === 0) return;
    const currentIndex = audioAssets.findIndex((asset) => asset.id === currentAudioAssetId);
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + direction + audioAssets.length) % audioAssets.length;
    const nextAsset = audioAssets[nextIndex];
    if (!nextAsset) return;
    setCurrentAudioAssetId(nextAsset.id);
    setRequestedPlay(true);
  }, [audioAssets, currentAudioAssetId]);

  const playPrevious = useCallback(() => { playAdjacent(-1); }, [playAdjacent]);
  const playNext = useCallback(() => { playAdjacent(1); }, [playAdjacent]);

  const toggleLoop = useCallback(() => {
    setLoopEnabled((prev) => !prev);
  }, []);

  const seekTo = useCallback((time: number) => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;
    const max = Number.isFinite(audioEl.duration) ? audioEl.duration : time;
    const safe = Number.isFinite(time) ? Math.min(Math.max(time, 0), max) : 0;
    audioEl.currentTime = safe;
    setCurrentTime(safe);
  }, []);

  const clearAudio = useCallback(() => {
    setCurrentAudioAssetId(null);
    setRequestedPlay(false);
  }, []);

  const audio = useMemo<AudioValue>(() => ({
    audioAssets,
    currentAudioAsset,
    currentAudioAssetId: currentAudioAsset?.id ?? null,
    currentTime,
    duration,
    isPlaying,
    loopEnabled,
    armAudio,
    clearAudio,
    pause: pauseAudio,
    play: playAudio,
    playNext,
    playPrevious,
    seekTo,
    selectAudio,
    toggleLoop,
    togglePlayback,
  }), [armAudio, audioAssets, clearAudio, currentAudioAsset, currentTime, duration, isPlaying, loopEnabled, pauseAudio, playAudio, playNext, playPrevious, seekTo, selectAudio, toggleLoop, togglePlayback]);

  // ── Stage selection ──

  const [currentStageId, setCurrentStageId] = useState<Id | null>(null);

  const stage = useMemo<StageValue>(() => ({
    currentStageId,
    setCurrentStageId,
  }), [currentStageId]);

  // ── Combined value ──

  const value = useMemo<PlaybackContextValue>(() => ({ layers, audio, stage }), [layers, audio, stage]);

  return (
    <PresentationLayersContext.Provider value={layers}>
      <PresentationMediaLayerContext.Provider value={mediaLayer}>
        <PresentationOverlayLayerContext.Provider value={overlayLayer}>
          <PresentationRenderLayerContext.Provider value={renderLayer}>
            <PresentationLayerActionsContext.Provider value={layerActions}>
              <AudioPlaybackContext.Provider value={audio}>
                <StagePlaybackContext.Provider value={stage}>
                  <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
                </StagePlaybackContext.Provider>
              </AudioPlaybackContext.Provider>
            </PresentationLayerActionsContext.Provider>
          </PresentationRenderLayerContext.Provider>
        </PresentationOverlayLayerContext.Provider>
      </PresentationMediaLayerContext.Provider>
    </PresentationLayersContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
}

export function usePresentationLayers(): LayersValue {
  const ctx = useContext(PresentationLayersContext);
  if (!ctx) throw new Error('usePresentationLayers must be used within PlaybackProvider');
  return ctx;
}

export function usePresentationMediaLayer(): PresentationMediaLayerValue {
  const ctx = useContext(PresentationMediaLayerContext);
  if (!ctx) throw new Error('usePresentationMediaLayer must be used within PlaybackProvider');
  return ctx;
}

export function usePresentationOverlayLayer(): PresentationOverlayLayerValue {
  const ctx = useContext(PresentationOverlayLayerContext);
  if (!ctx) throw new Error('usePresentationOverlayLayer must be used within PlaybackProvider');
  return ctx;
}

export function usePresentationRenderLayer(): PresentationRenderLayerValue {
  const ctx = useContext(PresentationRenderLayerContext);
  if (!ctx) throw new Error('usePresentationRenderLayer must be used within PlaybackProvider');
  return ctx;
}

export function usePresentationLayerActions(): PresentationLayerActionsValue {
  const ctx = useContext(PresentationLayerActionsContext);
  if (!ctx) throw new Error('usePresentationLayerActions must be used within PlaybackProvider');
  return ctx;
}

export function useAudio(): AudioValue {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) throw new Error('useAudio must be used within PlaybackProvider');
  return ctx;
}

export function useStagePlayback(): StageValue {
  const ctx = useContext(StagePlaybackContext);
  if (!ctx) throw new Error('useStagePlayback must be used within PlaybackProvider');
  return ctx;
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
