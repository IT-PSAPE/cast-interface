import type { RenderScene } from './scene-types';

interface ShouldSkipFrameCaptureInput {
  assetReadyVersion: number;
  currentScene: RenderScene;
  hasVideo: boolean;
  lastAssetReadyVersion: number | null;
  lastScene: RenderScene | null;
}

export function shouldSkipFrameCapture({
  assetReadyVersion,
  currentScene,
  hasVideo,
  lastAssetReadyVersion,
  lastScene,
}: ShouldSkipFrameCaptureInput): boolean {
  if (hasVideo) return false;
  return lastScene === currentScene && lastAssetReadyVersion === assetReadyVersion;
}
