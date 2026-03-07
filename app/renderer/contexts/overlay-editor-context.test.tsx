import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSnapshot, LibraryBundle, Overlay } from '@core/types';
import { OverlayEditorProvider, useOverlayEditor } from './overlay-editor-context';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useWorkbench } from './workbench-context';

vi.mock('./cast-context', () => ({
  useCast: vi.fn(),
}));

vi.mock('./navigation-context', () => ({
  useNavigation: vi.fn(),
}));

vi.mock('./workbench-context', () => ({
  useWorkbench: vi.fn(),
}));

interface OverlayEditorProbeValue extends ReturnType<typeof useOverlayEditor> {}

let probeValue: OverlayEditorProbeValue | null = null;

function Probe() {
  probeValue = useOverlayEditor();
  return null;
}

function createOverlay(overrides: Partial<Overlay> = {}): Overlay {
  return {
    id: 'overlay-1',
    libraryId: 'library-1',
    name: 'Overlay One',
    type: 'text',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    opacity: 1,
    zIndex: 0,
    enabled: true,
    payload: {
      text: 'Overlay One',
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      weight: '700',
    },
    elements: [],
    animation: { kind: 'fade', durationMs: 2500 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createBundle(overlays: Overlay[]): LibraryBundle {
  return {
    library: {
      id: 'library-1',
      name: 'Library',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    presentations: [],
    slides: [],
    slideElements: [],
    playlists: [],
    mediaAssets: [],
    overlays,
  };
}

function createSnapshot(overlays: Overlay[]): AppSnapshot {
  return {
    libraries: [{
      id: 'library-1',
      name: 'Library',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    bundles: [createBundle(overlays)],
  };
}

describe('OverlayEditorProvider', () => {
  const updateOverlay = vi.fn();
  const createOverlayApi = vi.fn();
  const deleteOverlay = vi.fn();
  const getSnapshot = vi.fn();
  const mutate = vi.fn(async (action: () => Promise<AppSnapshot>) => action());
  const setStatusText = vi.fn();

  let activeBundle: LibraryBundle;
  let workbenchMode: 'show' | 'slide-editor' | 'overlay-editor';

  beforeEach(() => {
    vi.clearAllMocks();
    probeValue = null;

    activeBundle = createBundle([createOverlay()]);
    workbenchMode = 'overlay-editor';

    window.castApi = {
      updateOverlay,
      createOverlay: createOverlayApi,
      deleteOverlay,
      getSnapshot,
    } as unknown as Window['castApi'];

    vi.mocked(useCast).mockReturnValue({
      snapshot: createSnapshot(activeBundle.overlays),
      statusText: 'Ready',
      setStatusText,
      mutate,
    });
    vi.mocked(useNavigation).mockImplementation(() => ({
      activeBundle,
    } as ReturnType<typeof useNavigation>));
    vi.mocked(useWorkbench).mockImplementation(() => ({
      workbenchMode,
    } as ReturnType<typeof useWorkbench>));
  });

  it('stages overlay edits locally until push', async () => {
    render(
      <OverlayEditorProvider>
        <Probe />
      </OverlayEditorProvider>,
    );

    if (!probeValue) throw new Error('Expected overlay editor context');

    act(() => {
      probeValue?.updateOverlayDraft({ id: 'overlay-1', name: 'Overlay Draft' });
    });

    expect(probeValue.currentOverlay?.name).toBe('Overlay Draft');
    expect(probeValue.hasPendingChanges).toBe(true);
    expect(updateOverlay).not.toHaveBeenCalled();
  });

  it('pushes pending overlay edits when leaving overlay edit', async () => {
    const pushedOverlay = createOverlay({ name: 'Overlay Draft' });
    updateOverlay.mockResolvedValue(createSnapshot([pushedOverlay]));
    getSnapshot.mockResolvedValue(createSnapshot(activeBundle.overlays));

    const view = render(
      <OverlayEditorProvider>
        <Probe />
      </OverlayEditorProvider>,
    );

    if (!probeValue) throw new Error('Expected overlay editor context');

    act(() => {
      probeValue?.updateOverlayDraft({ id: 'overlay-1', name: 'Overlay Draft' });
    });

    workbenchMode = 'show';
    view.rerender(
      <OverlayEditorProvider>
        <Probe />
      </OverlayEditorProvider>,
    );

    await waitFor(() => {
      expect(updateOverlay).toHaveBeenCalledWith({
        id: 'overlay-1',
        name: 'Overlay Draft',
        elements: [],
        animation: { kind: 'fade', durationMs: 2500 },
      });
    });
  });
});
