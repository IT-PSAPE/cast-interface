import { describe, expect, it } from 'vitest';
import type { Overlay } from '@core/types';
import {
  activateOverlayPlayback,
  advanceOverlayPlayback,
  clearOverlayPlayback,
  collapseOverlayPlaybackToSingle,
  getOverlayRenderLayers,
  type ActiveOverlayEntry,
} from './overlay-playback';

function createOverlay(id: string, name: string, overrides: Partial<Overlay> = {}): Overlay {
  return {
    id,
    name,
    type: 'text',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    opacity: 1,
    zIndex: 0,
    enabled: true,
    payload: {
      text: name,
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      weight: '700',
    },
    elements: [],
    animation: {
      kind: 'dissolve',
      durationMs: 400,
      autoClearDurationMs: null,
    },
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function createEntry(overrides: Partial<ActiveOverlayEntry> = {}): ActiveOverlayEntry {
  return {
    overlayId: 'overlay-1',
    state: 'live',
    startedAt: 0,
    exitStartedAt: null,
    exitStartOpacity: 1,
    stackOrder: 0,
    autoClearAt: null,
    ...overrides,
  };
}

describe('overlay playback', () => {
  it('replaces the active overlay in single mode by exiting the previous one', () => {
    const overlaysById = new Map([
      ['overlay-1', createOverlay('overlay-1', 'One')],
      ['overlay-2', createOverlay('overlay-2', 'Two')],
    ]);

    const next = activateOverlayPlayback([createEntry()], overlaysById, 'overlay-2', 'single', 1000);

    expect(next).toHaveLength(2);
    expect(next[0]?.overlayId).toBe('overlay-1');
    expect(next[0]?.state).toBe('exiting');
    expect(next[1]?.overlayId).toBe('overlay-2');
  });

  it('keeps multiple overlays active in multiple mode', () => {
    const overlaysById = new Map([
      ['overlay-1', createOverlay('overlay-1', 'One')],
      ['overlay-2', createOverlay('overlay-2', 'Two')],
    ]);

    const next = activateOverlayPlayback([createEntry()], overlaysById, 'overlay-2', 'multiple', 1000);

    expect(next).toHaveLength(2);
    expect(next.map((entry) => entry.overlayId)).toEqual(['overlay-1', 'overlay-2']);
  });

  it('starts an exit transition when clearing an overlay', () => {
    const overlaysById = new Map([
      ['overlay-1', createOverlay('overlay-1', 'One')],
    ]);

    const next = clearOverlayPlayback([createEntry()], overlaysById, 'overlay-1', 500);

    expect(next).toHaveLength(1);
    expect(next[0]?.state).toBe('exiting');
    expect(next[0]?.exitStartedAt).toBe(500);
  });

  it('auto clears overlays after the configured duration', () => {
    const overlaysById = new Map([
      ['overlay-1', createOverlay('overlay-1', 'One', {
        animation: { kind: 'dissolve', durationMs: 400, autoClearDurationMs: 1000 },
      })],
    ]);

    const active = activateOverlayPlayback([], overlaysById, 'overlay-1', 'single', 0);
    const next = advanceOverlayPlayback(active, overlaysById, 1000);

    expect(next).toHaveLength(1);
    expect(next[0]?.state).toBe('exiting');
  });

  it('reports transition opacity while an overlay is entering', () => {
    const overlaysById = new Map([
      ['overlay-1', createOverlay('overlay-1', 'One')],
    ]);

    const layers = getOverlayRenderLayers([
      createEntry({ state: 'entering', startedAt: 0 }),
    ], overlaysById, 200);

    expect(layers[0]?.opacityMultiplier).toBeCloseTo(0.5, 1);
  });

  it('collapses multiple live overlays down to the highest stack order entry', () => {
    const overlaysById = new Map([
      ['overlay-1', createOverlay('overlay-1', 'One')],
      ['overlay-2', createOverlay('overlay-2', 'Two')],
    ]);

    const next = collapseOverlayPlaybackToSingle([
      createEntry({ overlayId: 'overlay-1', stackOrder: 0 }),
      createEntry({ overlayId: 'overlay-2', stackOrder: 1 }),
    ], overlaysById, 250);

    expect(next).toHaveLength(2);
    expect(next[0]?.state).toBe('exiting');
    expect(next[1]?.state).toBe('live');
  });
});
