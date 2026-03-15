import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TemplateCard } from './template-card';

const sceneFrameMock = vi.fn();

vi.mock('../../../components/scene-frame', () => ({
  SceneFrame: function SceneFrame({
    children,
    checkerboard,
  }: {
    children: React.ReactNode;
    checkerboard?: boolean;
  }) {
    sceneFrameMock({ checkerboard });
    return <div data-testid="scene-frame">{children}</div>;
  },
}));

vi.mock('../../stage/rendering/build-render-scene', () => ({
  buildRenderScene: () => ({
    width: 1920,
    height: 1080,
    nodes: [],
  }),
}));

vi.mock('../../stage/rendering/scene-stage', () => ({
  SceneStage: function SceneStage() {
    return <div data-testid="scene-stage" />;
  },
}));

describe('TemplateCard', () => {
  it('renders template thumbnails with a checkerboard transparency background', () => {
    render(
      <TemplateCard
        selected={false}
        template={{
          id: 'template-1',
          kind: 'slides',
          name: 'Template',
          width: 1920,
          height: 1080,
          elements: [],
          order: 0,
          createdAt: '2026-03-15T00:00:00.000Z',
          updatedAt: '2026-03-15T00:00:00.000Z',
        }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId('scene-frame')).toBeTruthy();
    expect(sceneFrameMock).toHaveBeenCalledWith({ checkerboard: true });
  });
});
