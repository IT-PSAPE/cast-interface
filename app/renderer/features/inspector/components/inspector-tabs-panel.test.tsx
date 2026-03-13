import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectorTabsPanel } from './inspector-tabs-panel';
import { useInspector } from '../../../contexts/inspector-context';
import { useAvailableInspectorTabs } from '../hooks/use-available-inspector-tabs';

vi.mock('../../../contexts/inspector-context', () => ({
  useInspector: vi.fn(),
}));

vi.mock('../hooks/use-inspector-auto-tab', () => ({
  useInspectorAutoTab: vi.fn(),
}));

vi.mock('../hooks/use-available-inspector-tabs', () => ({
  useAvailableInspectorTabs: vi.fn(),
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
    vi.mocked(useAvailableInspectorTabs).mockReturnValue([
      { name: 'slide', label: 'Overlay' },
    ]);

    render(<InspectorTabsPanel />);

    expect(screen.getByRole('tab', { name: 'Overlay' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Shape' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Text' })).toBeNull();
    expect(screen.getByText('overlay-inspector')).toBeTruthy();
  });

  it('shows shape and text tabs when a text overlay element is selected', () => {
    vi.mocked(useInspector).mockReturnValue({
      inspectorTab: 'text',
      setInspectorTab,
    });
    vi.mocked(useAvailableInspectorTabs).mockReturnValue([
      { name: 'shape', label: 'Shape' },
      { name: 'text', label: 'Text' },
    ]);

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
    vi.mocked(useAvailableInspectorTabs).mockReturnValue([
      { name: 'shape', label: 'Shape' },
    ]);

    render(<InspectorTabsPanel />);

    expect(screen.queryByRole('tab', { name: 'Overlay' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Shape' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Text' })).toBeNull();
    expect(screen.getByText('shape-inspector')).toBeTruthy();
  });
});
