import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RenderNode } from './scene-types';
import { SceneNodeMedia } from './scene-node-media';

const useKImageMock = vi.fn();
const useKVideoMock = vi.fn();

vi.mock('./use-k-image', () => ({
  useKImage: (src: string | null) => useKImageMock(src),
}));

vi.mock('./use-k-video', () => ({
  useKVideo: (src: string | null, options: { autoplay: boolean; loop: boolean; muted: boolean }) => useKVideoMock(src, options),
}));

vi.mock('react-konva', () => ({
  Image: ({ image }: { image: HTMLImageElement | HTMLVideoElement }) => (
    <div data-testid="scene-media" data-kind={image instanceof HTMLVideoElement ? 'video' : 'image'} />
  ),
  Rect: () => <div data-testid="scene-media-fallback" />,
  Group: ({ children }: { children?: React.ReactNode }) => <div data-testid="scene-media-group">{children}</div>,
  Line: () => <div data-testid="scene-media-stripe" />,
}));

function createNode(type: 'image' | 'video', src: string): RenderNode {
  return {
    id: '__layer_media',
    element: {
      id: '__layer_media',
      slideId: '__layer_preview__',
      type,
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
      layer: 'media',
      payload: type === 'image'
        ? { src }
        : { src, autoplay: true, loop: true, muted: true },
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
    isVideo: type === 'video',
  };
}

describe('SceneNodeMedia', () => {
  beforeEach(() => {
    useKImageMock.mockReset();
    useKVideoMock.mockReset();
  });

  it('keeps the previous media on screen while a different media type is still loading', () => {
    const image = document.createElement('img');
    const video = document.createElement('video');

    useKImageMock.mockImplementation((src: string | null) => (src ? { status: 'loaded', resource: image } : { status: 'empty' }));
    useKVideoMock.mockReturnValue({ status: 'loading' });

    const { rerender } = render(<SceneNodeMedia node={createNode('image', '/background-a.png')} />);

    expect(screen.getByTestId('scene-media').getAttribute('data-kind')).toBe('image');

    rerender(<SceneNodeMedia node={createNode('video', '/background-b.mp4')} />);

    expect(screen.getByTestId('scene-media').getAttribute('data-kind')).toBe('image');

    useKVideoMock.mockReturnValue({ status: 'loaded', resource: video });
    rerender(<SceneNodeMedia node={createNode('video', '/background-b.mp4')} />);

    expect(screen.getByTestId('scene-media').getAttribute('data-kind')).toBe('video');
  });

  it('renders a broken placeholder on the slide editor surface', () => {
    useKImageMock.mockReturnValue({ status: 'broken' });
    useKVideoMock.mockReturnValue({ status: 'empty' });

    render(<SceneNodeMedia node={createNode('image', '/missing.png')} surface="slide-editor" />);

    expect(screen.getByTestId('scene-media-group')).not.toBeNull();
    expect(screen.getAllByTestId('scene-media-stripe').length).toBeGreaterThan(0);
  });

  it('keeps broken media invisible on list surfaces', () => {
    useKImageMock.mockReturnValue({ status: 'broken' });
    useKVideoMock.mockReturnValue({ status: 'empty' });

    render(<SceneNodeMedia node={createNode('image', '/missing.png')} surface="list" />);

    expect(screen.queryByTestId('scene-media-group')).toBeNull();
    expect(screen.getByTestId('scene-media-fallback')).not.toBeNull();
  });
});
