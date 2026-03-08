import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlideFrame } from '@core/types';
import type { RenderScene } from '../../workspace/rendering/scene-types';
import { LivePreview } from './live-preview';
import { useRenderScenes } from '../../workspace/rendering/render-scene-provider';

interface CapturedStageProps {
  emitFramesFps: number | null | undefined;
  onFrame: ((frame: SlideFrame) => void) | undefined;
}

const capturedStageProps: CapturedStageProps = {
  emitFramesFps: undefined,
  onFrame: undefined
};

vi.mock('../../workspace/rendering/render-scene-provider', () => ({
  useRenderScenes: vi.fn()
}));

vi.mock('../../workspace/rendering/scene-stage', () => ({
  SceneStage: (props: { emitFramesFps?: number | null; onFrame?: (frame: SlideFrame) => void }) => {
    capturedStageProps.emitFramesFps = props.emitFramesFps;
    capturedStageProps.onFrame = props.onFrame;
    return <div data-testid="live-preview-stage" />;
  }
}));

function createLiveScene(): RenderScene {
  return {
    slide: {
      id: 'slide-1',
      presentationId: 'presentation-1',
      width: 1920,
      height: 1080,
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    width: 1920,
    height: 1080,
    nodes: [{} as unknown as RenderScene['nodes'][number]]
  };
}

describe('LivePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedStageProps.emitFramesFps = undefined;
    capturedStageProps.onFrame = undefined;
  });

  it('renders preview only and does not attach NDI frame transport side effects', () => {
    const sendNdiFrame = vi.fn();
    const connectNdiFramePort = vi.fn();
    window.castApi = { sendNdiFrame, connectNdiFramePort } as unknown as Window['castApi'];

    vi.mocked(useRenderScenes).mockReturnValue({
      liveScene: createLiveScene()
    } as unknown as ReturnType<typeof useRenderScenes>);

    render(<LivePreview />);

    expect(capturedStageProps.emitFramesFps).toBeUndefined();
    expect(capturedStageProps.onFrame).toBeUndefined();
    expect(sendNdiFrame).toHaveBeenCalledTimes(0);
    expect(connectNdiFramePort).toHaveBeenCalledTimes(0);
  });
});
