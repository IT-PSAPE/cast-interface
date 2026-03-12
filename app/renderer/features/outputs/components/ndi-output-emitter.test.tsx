import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import type { SlideFrame } from '@core/types';
import type { RenderScene } from '../../stage/rendering/scene-types';
import { NdiOutputEmitter } from './ndi-output-emitter';
import { useNdi } from '../../../contexts/ndi-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';

interface CapturedStageProps {
  emitFramesFps: number | null | undefined;
  onFrame: ((frame: SlideFrame) => void) | undefined;
}

const capturedStageProps: CapturedStageProps = {
  emitFramesFps: undefined,
  onFrame: undefined
};

const stageLifecycle = {
  mounts: 0,
  unmounts: 0
};

vi.mock('../../../contexts/ndi-context', () => ({
  useNdi: vi.fn()
}));

vi.mock('../../stage/rendering/render-scene-provider', () => ({
  useRenderScenes: vi.fn()
}));

vi.mock('../../stage/rendering/scene-stage', () => ({
  SceneStage: (props: { emitFramesFps?: number | null; onFrame?: (frame: SlideFrame) => void }) => {
    useEffect(() => {
      stageLifecycle.mounts += 1;
      return () => {
        stageLifecycle.unmounts += 1;
      };
    }, []);

    capturedStageProps.emitFramesFps = props.emitFramesFps;
    capturedStageProps.onFrame = props.onFrame;
    return <div data-testid="ndi-output-stage" />;
  }
}));

function createFrame(width: number, height: number): SlideFrame {
  return {
    width,
    height,
    rgba: new Uint8ClampedArray(width * height * 4),
    timestamp: Date.now()
  };
}

function createOutputScene(): RenderScene {
  return {
    slide: {
      id: 'slide-1',
      presentationId: 'presentation-1',
      width: 1920,
      height: 1080,
      notes: '',
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    width: 1920,
    height: 1080,
    nodes: []
  };
}

describe('NdiOutputEmitter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedStageProps.emitFramesFps = undefined;
    capturedStageProps.onFrame = undefined;
    stageLifecycle.mounts = 0;
    stageLifecycle.unmounts = 0;
  });

  it('emits frames whenever an output is enabled', async () => {
    const sendNdiFrameZeroCopy = vi.fn();
    window.castApi = { sendNdiFrameZeroCopy } as unknown as Window['castApi'];

    vi.mocked(useNdi).mockReturnValue({
      outputState: { audience: true },
      toggleAudienceOutput: vi.fn()
    });
    vi.mocked(useRenderScenes).mockReturnValue({
      outputScene: createOutputScene()
    } as unknown as ReturnType<typeof useRenderScenes>);

    render(<NdiOutputEmitter />);

    expect(capturedStageProps.emitFramesFps).toBe(30);
    expect(capturedStageProps.onFrame).toBeDefined();

    const onFrame = capturedStageProps.onFrame;
    if (!onFrame) throw new Error('Expected onFrame handler');
    onFrame(createFrame(1920, 1080));

    expect(sendNdiFrameZeroCopy).toHaveBeenCalledTimes(1);
  });

  it('does not emit frames when all outputs are disabled', () => {
    const sendNdiFrameZeroCopy = vi.fn();
    window.castApi = { sendNdiFrameZeroCopy } as unknown as Window['castApi'];

    vi.mocked(useNdi).mockReturnValue({
      outputState: { audience: false },
      toggleAudienceOutput: vi.fn()
    });
    vi.mocked(useRenderScenes).mockReturnValue({
      outputScene: createOutputScene()
    } as unknown as ReturnType<typeof useRenderScenes>);

    const view = render(<NdiOutputEmitter />);

    expect(view.queryByTestId('ndi-output-stage')).toBeNull();
    expect(stageLifecycle.mounts).toBe(0);
    expect(stageLifecycle.unmounts).toBe(0);
    expect(capturedStageProps.emitFramesFps).toBeUndefined();
    expect(capturedStageProps.onFrame).toBeUndefined();
    expect(sendNdiFrameZeroCopy).toHaveBeenCalledTimes(0);
  });

  it('mounts the capture stage only while output is enabled', () => {
    const sendNdiFrameZeroCopy = vi.fn();
    window.castApi = { sendNdiFrameZeroCopy } as unknown as Window['castApi'];

    let outputState = { audience: false };
    vi.mocked(useNdi).mockImplementation(() => ({
      outputState,
      toggleAudienceOutput: vi.fn()
    }));
    vi.mocked(useRenderScenes).mockReturnValue({
      outputScene: createOutputScene()
    } as unknown as ReturnType<typeof useRenderScenes>);

    const view = render(<NdiOutputEmitter />);
    expect(view.queryByTestId('ndi-output-stage')).toBeNull();

    outputState = { audience: true };
    view.rerender(<NdiOutputEmitter />);
    expect(view.getByTestId('ndi-output-stage')).toBeTruthy();
    expect(stageLifecycle.mounts).toBe(1);
    expect(stageLifecycle.unmounts).toBe(0);
    expect(capturedStageProps.emitFramesFps).toBe(30);

    outputState = { audience: false };
    view.rerender(<NdiOutputEmitter />);
    expect(view.queryByTestId('ndi-output-stage')).toBeNull();
    expect(stageLifecycle.mounts).toBe(1);
    expect(stageLifecycle.unmounts).toBe(1);
  });
});
