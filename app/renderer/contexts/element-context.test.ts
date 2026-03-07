import { describe, expect, it } from 'vitest';
import type { Overlay } from '@core/types';
import { isOverlaySelectionValid } from './element-context';

const baseOverlay: Overlay = {
  id: 'overlay-1',
  libraryId: 'library-1',
  name: 'Overlay',
  type: 'text',
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  opacity: 1,
  zIndex: 1,
  enabled: true,
  payload: {
    text: 'Overlay',
    fontFamily: 'Avenir Next',
    fontSize: 72,
    color: '#FFFFFF',
    alignment: 'center',
    weight: '700',
  },
  elements: [],
  animation: {
    kind: 'none',
    durationMs: 0,
  },
  createdAt: '',
  updatedAt: '',
};

describe('isOverlaySelectionValid', () => {
  it('keeps selection for fallback overlay element ids', () => {
    expect(isOverlaySelectionValid(baseOverlay, 'overlay-1')).toBe(true);
  });

  it('keeps selection for nested overlay element ids', () => {
    const overlay: Overlay = {
      ...baseOverlay,
      elements: [
        {
          id: 'element-1',
          slideId: 'overlay-1',
          type: 'text',
          x: 0,
          y: 0,
          width: 400,
          height: 120,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          layer: 'content',
          payload: {
            text: 'Nested',
            fontFamily: 'Avenir Next',
            fontSize: 42,
            color: '#FFFFFF',
            alignment: 'left',
            weight: '700',
          },
          createdAt: '',
          updatedAt: '',
        },
      ],
    };

    expect(isOverlaySelectionValid(overlay, 'element-1')).toBe(true);
    expect(isOverlaySelectionValid(overlay, 'overlay-1')).toBe(false);
  });
});
