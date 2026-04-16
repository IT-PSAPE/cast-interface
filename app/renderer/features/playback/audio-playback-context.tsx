import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { useProjectContent } from '../../contexts/use-project-content';

interface ShowAudioContextValue {
  actions: {
    clearAudio: () => void;
    pause: () => void;
    play: () => void;
    playNext: () => void;
    playPrevious: () => void;
    seekTo: (time: number) => void;
    selectAudio: (assetId: Id) => void;
    toggleLoop: () => void;
    togglePlayback: () => void;
  };
  state: {
    audioAssets: MediaAsset[];
    currentAudioAsset: MediaAsset | null;
    currentAudioAssetId: Id | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    loopEnabled: boolean;
  };
}

const ShowAudioContext = createContext<ShowAudioContextValue | null>(null);

export function ShowAudioProvider({ children }: { children: ReactNode }) {
  const { mediaAssets } = useProjectContent();
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
    const audio = audioElementRef.current;
    if (!audio) return;

    if (!asset) {
      audio.pause();
      audio.removeAttribute('src');
      delete audio.dataset.assetId;
      delete audio.dataset.assetSrc;
      audio.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const sourceChanged = audio.dataset.assetId !== asset.id || audio.dataset.assetSrc !== asset.src;

    if (sourceChanged) {
      audio.pause();
      audio.src = asset.src;
      audio.dataset.assetId = asset.id;
      audio.dataset.assetSrc = asset.src;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (resetPosition) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }

    if (autoplay) {
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    audio.pause();
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

  const play = useCallback(() => {
    const nextAsset = currentAudioAsset ?? audioAssets[0] ?? null;
    if (!nextAsset) return;
    setCurrentAudioAssetId(nextAsset.id);
    syncAudioSource(nextAsset, true, false);
  }, [audioAssets, currentAudioAsset, syncAudioSource]);

  const pause = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const playAdjacent = useCallback((direction: 1 | -1) => {
    if (audioAssets.length === 0) return;

    const currentIndex = currentAudioAsset
      ? audioAssets.findIndex((asset) => asset.id === currentAudioAsset.id)
      : -1;
    const safeIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + audioAssets.length) % audioAssets.length;
    const nextAsset = audioAssets[nextIndex] ?? null;

    if (!nextAsset) return;

    setCurrentAudioAssetId(nextAsset.id);
    syncAudioSource(nextAsset, true, true);
  }, [audioAssets, currentAudioAsset, syncAudioSource]);

  const playPrevious = useCallback(() => {
    playAdjacent(-1);
  }, [playAdjacent]);

  const playNext = useCallback(() => {
    playAdjacent(1);
  }, [playAdjacent]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }
    play();
  }, [isPlaying, pause, play]);

  const toggleLoop = useCallback(() => {
    setLoopEnabled((current) => !current);
  }, []);

  const seekTo = useCallback((time: number) => {
    const audio = audioElementRef.current;
    if (!audio) return;
    const nextTime = Number.isFinite(time) ? Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time) : 0;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const clearAudio = useCallback(() => {
    const firstAsset = audioAssets[0] ?? null;
    setCurrentAudioAssetId(firstAsset?.id ?? null);
    syncAudioSource(firstAsset, false, true);
  }, [audioAssets, syncAudioSource]);

  useEffect(() => {
    const nextAudio = audioElementRef.current;
    if (!nextAudio) return;
    const audio = nextAudio;

    function handleTimeUpdate() {
      setCurrentTime(audio.currentTime);
    }

    function handleLoadedMetadata() {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
    }

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    audio.loop = loopEnabled;
  }, [loopEnabled]);

  useEffect(() => {
    if (audioAssets.length === 0) {
      syncAudioSource(null, false, true);
      if (currentAudioAssetId !== null) {
        setCurrentAudioAssetId(null);
      }
      return;
    }

    if (currentAudioAssetId && audioAssets.some((asset) => asset.id === currentAudioAssetId)) {
      return;
    }

    const firstAsset = audioAssets[0];
    setCurrentAudioAssetId(firstAsset.id);
    syncAudioSource(firstAsset, false, true);
  }, [audioAssets, currentAudioAssetId, syncAudioSource]);

  useEffect(() => {
    if (!currentAudioAsset) return;
    syncAudioSource(currentAudioAsset, isPlaying, false);
  }, [currentAudioAsset, isPlaying, syncAudioSource]);

  const value = useMemo<ShowAudioContextValue>(() => ({
    actions: {
      clearAudio,
      pause,
      play,
      playNext,
      playPrevious,
      seekTo,
      selectAudio,
      toggleLoop,
      togglePlayback,
    },
    state: {
      audioAssets,
      currentAudioAsset,
      currentAudioAssetId: currentAudioAsset?.id ?? null,
      currentTime,
      duration,
      isPlaying,
      loopEnabled,
    },
  }), [audioAssets, clearAudio, currentAudioAsset, currentTime, duration, isPlaying, loopEnabled, pause, play, playNext, playPrevious, seekTo, selectAudio, toggleLoop, togglePlayback]);

  return <ShowAudioContext.Provider value={value}>{children}</ShowAudioContext.Provider>;
}

export function useShowAudio(): ShowAudioContextValue {
  const context = useContext(ShowAudioContext);
  if (!context) throw new Error('useShowAudio must be used within ShowAudioProvider');
  return context;
}
