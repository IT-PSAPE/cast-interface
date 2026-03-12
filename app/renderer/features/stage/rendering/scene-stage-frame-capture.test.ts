import { describe, expect, it } from 'vitest';
import type { RenderScene } from './scene-types';
import { shouldSkipFrameCapture } from './scene-stage-frame-capture';

function createScene(): RenderScene {
  return {
    slide: {
      id: 'slide-1',
      presentationId: 'presentation-1',
      width: 1920,
      height: 1080,
      notes: '',
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    width: 1920,
    height: 1080,
    nodes: [],
  };
}

describe('shouldSkipFrameCapture', () => {
  it('skips repeated static captures when nothing changed', () => {
    const scene = createScene();
    expect(shouldSkipFrameCapture({
      hasVideo: false,
      currentScene: scene,
      lastScene: scene,
      assetReadyVersion: 0,
      lastAssetReadyVersion: 0,
    })).toBe(true);
  });

  it('captures again when an async asset becomes ready', () => {
    const scene = createScene();
    expect(shouldSkipFrameCapture({
      hasVideo: false,
      currentScene: scene,
      lastScene: scene,
      assetReadyVersion: 1,
      lastAssetReadyVersion: 0,
    })).toBe(false);
  });

  it('never skips video-backed scenes', () => {
    const scene = createScene();
    expect(shouldSkipFrameCapture({
      hasVideo: true,
      currentScene: scene,
      lastScene: scene,
      assetReadyVersion: 0,
      lastAssetReadyVersion: 0,
    })).toBe(false);
  });
});
