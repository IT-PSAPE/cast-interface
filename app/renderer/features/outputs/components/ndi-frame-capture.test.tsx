import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RenderScene } from '../../stage/rendering/scene-types';
import { NdiFrameCapture } from './ndi-frame-capture';

const sendNdiFrame = vi.fn();
const batchDraw = vi.fn();
const getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(4) }));
const getContext = vi.fn(() => ({ getImageData }));
const getNativeCanvasElement = vi.fn(() => ({
  width: 1920,
  height: 1080,
  getContext,
}));
const getLayers = vi.fn(() => [{ getNativeCanvasElement }]);

const useNdiMock = vi.fn();
const useRenderScenesMock = vi.fn();

vi.mock('react-konva', async () => {
  const React = await import('react');

  const Stage = React.forwardRef(function Stage(
    { children }: { children?: React.ReactNode },
    ref: React.ForwardedRef<{ batchDraw: () => void; getLayers: () => Array<{ getNativeCanvasElement: () => { getContext: () => { getImageData: typeof getImageData } } }> }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      batchDraw,
      getLayers,
    }), []);

    return <div data-testid="stage">{children}</div>;
  });

  function Layer({ children }: { children?: React.ReactNode }) {
    return <div>{children}</div>;
  }

  function Group({ children }: { children?: React.ReactNode }) {
    return <div>{children}</div>;
  }

  return { Stage, Layer, Group };
});

vi.mock('../../../contexts/ndi-context', () => ({
  useNdi: () => useNdiMock(),
}));

vi.mock('../../stage/rendering/render-scene-provider', () => ({
  useRenderScenes: () => useRenderScenesMock(),
}));

vi.mock('../../stage/rendering/scene-node-shape', () => ({
  SceneNodeShape: () => <div data-testid="scene-node-shape" />,
}));

vi.mock('../../stage/rendering/scene-node-text', () => ({
  SceneNodeText: () => <div data-testid="scene-node-text" />,
}));

vi.mock('../../stage/rendering/scene-node-media', async () => {
  const React = await import('react');

  function SceneNodeMedia({ onLoad }: { onLoad?: () => void }) {
    React.useEffect(() => {
      if (!onLoad) return;

      const timeoutId = window.setTimeout(() => {
        onLoad();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }, [onLoad]);

    return <div data-testid="scene-node-media" />;
  }

  return { SceneNodeMedia };
});

describe('NdiFrameCapture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(performance.now()), 0);
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      window.clearTimeout(id);
    });
    sendNdiFrame.mockReset();
    batchDraw.mockReset();
    getImageData.mockClear();
    getContext.mockClear();
    getNativeCanvasElement.mockClear();
    getLayers.mockClear();

    window.castApi = {
      sendNdiFrame,
    } as unknown as typeof window.castApi;

    useNdiMock.mockReturnValue({
      outputState: { audience: true },
      outputConfigs: { audience: { withAlpha: true } },
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('captures another frame after an image node finishes loading', async () => {
    useRenderScenesMock.mockReturnValue({
      programScene: createScene([
        {
          id: '__layer_media',
          element: {
            id: '__layer_media',
            slideId: '__layer_preview__',
            type: 'image',
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            rotation: 0,
            opacity: 1,
            zIndex: 0,
            layer: 'media',
            payload: { src: 'cast-media:///background-a.png' },
            createdAt: '',
            updatedAt: '',
          },
          visual: {
            visible: true,
            locked: false,
            flipX: false,
            flipY: false,
            fillEnabled: false,
            fillColor: '',
            strokeEnabled: false,
            strokeColor: '',
            strokeWidth: 0,
            strokePosition: 'inside',
            shadowEnabled: false,
            shadowColor: '',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          isVideo: false,
        },
      ]),
    });

    render(<NdiFrameCapture />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(sendNdiFrame).toHaveBeenCalledTimes(2);
    expect(batchDraw).toHaveBeenCalled();
  });
});

function createScene(nodes: RenderScene['nodes']): RenderScene {
  return {
    slide: {
      id: 'slide-1',
      deckId: 'presentation-1',
      lyricId: null,
      width: 1920,
      height: 1080,
      notes: '',
      order: 0,
      createdAt: '',
      updatedAt: '',
    },
    width: 1920,
    height: 1080,
    nodes,
  };
}
