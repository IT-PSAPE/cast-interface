import { describe, expect, it } from 'vitest';
import { mapViewportPointToScene, type SceneViewportTransform } from './use-scene-stage-viewport';

describe('mapViewportPointToScene', () => {
  it('maps pointer position into scene coordinates with scale and offsets', () => {
    const viewport: SceneViewportTransform = {
      viewportWidth: 1000,
      viewportHeight: 600,
      sceneScale: 0.5,
      sceneOffsetX: 20,
      sceneOffsetY: 30,
      sceneWidth: 1920,
      sceneHeight: 1080,
    };
    const rect = new DOMRect(100, 200, 1000, 600);
    const point = mapViewportPointToScene(370, 380, rect, viewport);
    expect(point.x).toBeCloseTo(500, 5);
    expect(point.y).toBeCloseTo(300, 5);
  });

  it('clamps mapped coordinates to scene bounds', () => {
    const viewport: SceneViewportTransform = {
      viewportWidth: 1000,
      viewportHeight: 600,
      sceneScale: 0.5,
      sceneOffsetX: 20,
      sceneOffsetY: 30,
      sceneWidth: 1920,
      sceneHeight: 1080,
    };
    const rect = new DOMRect(0, 0, 1000, 600);
    const point = mapViewportPointToScene(-999, 9999, rect, viewport);
    expect(point.x).toBe(0);
    expect(point.y).toBe(1080);
  });
});
