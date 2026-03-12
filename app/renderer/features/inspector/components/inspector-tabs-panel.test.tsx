import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectorTabsPanel } from './inspector-tabs-panel';
import { useInspector } from '../../../contexts/inspector-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';

vi.mock('../../../contexts/inspector-context', () => ({
  useInspector: vi.fn(),
}));

vi.mock('../../../contexts/workbench-context', () => ({
  useWorkbench: vi.fn(),
}));

vi.mock('../../../contexts/element-context', () => ({
  useElements: vi.fn(),
}));

vi.mock('./presentation-inspector', () => ({
  PresentationInspector: () => <div>presentation-inspector</div>,
}));

vi.mock('./slide-inspector', () => ({
  SlideInspector: () => <div>overlay-inspector</div>,
}));

vi.mock('./shape-element-inspector', () => ({
  ShapeElementInspector: () => <div>shape-inspector</div>,
}));

vi.mock('./text-element-inspector', () => ({
  TextElementInspector: () => <div>text-inspector</div>,
}));

describe('InspectorTabsPanel', () => {
  const setInspectorTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInspector).mockReturnValue({
      inspectorTab: 'presentation',
      setInspectorTab,
    });
  });

  it('shows the overlay inspector by default in overlay edit when nothing is selected', () => {
    vi.mocked(useInspector).mockReturnValue({
      inspectorTab: 'slide',
      setInspectorTab,
    });
    vi.mocked(useWorkbench).mockReturnValue({
      workbenchMode: 'overlay-editor',
    } as ReturnType<typeof useWorkbench>);
    vi.mocked(useElements).mockReturnValue({
      selectedElement: null,
    } as ReturnType<typeof useElements>);

    render(<InspectorTabsPanel />);

    expect(screen.getByRole('tab', { name: 'Overlay' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Shape' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Text' })).toBeNull();
    expect(screen.getByText('overlay-inspector')).toBeTruthy();
  });

  it('shows shape and text tabs when a text overlay element is selected', () => {
    vi.mocked(useWorkbench).mockReturnValue({
      workbenchMode: 'overlay-editor',
    } as ReturnType<typeof useWorkbench>);
    vi.mocked(useElements).mockReturnValue({
      selectedElement: { id: 'element-1', type: 'text' },
    } as ReturnType<typeof useElements>);
    vi.mocked(useInspector).mockReturnValue({
      inspectorTab: 'text',
      setInspectorTab,
    });

    render(<InspectorTabsPanel />);

    expect(screen.queryByRole('tab', { name: 'Overlay' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Shape' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Text' })).toBeTruthy();
    expect(screen.getByText('text-inspector')).toBeTruthy();
  });

  it('shows only the shape inspector tab when a non-text overlay element is selected', () => {
    vi.mocked(useInspector).mockReturnValue({
      inspectorTab: 'shape',
      setInspectorTab,
    });
    vi.mocked(useWorkbench).mockReturnValue({
      workbenchMode: 'overlay-editor',
    } as ReturnType<typeof useWorkbench>);
    vi.mocked(useElements).mockReturnValue({
      selectedElement: { id: 'element-1', type: 'shape' },
    } as ReturnType<typeof useElements>);

    render(<InspectorTabsPanel />);

    expect(screen.queryByRole('tab', { name: 'Overlay' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Shape' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Text' })).toBeNull();
    expect(screen.getByText('shape-inspector')).toBeTruthy();
  });
});
