import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOutlineView } from './use-slide-list-view';

const useNavigationMock = vi.fn();
const useSlidesMock = vi.fn();
const useSlideBrowserMock = vi.fn();
const useSlideOutlineTextEditingMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

vi.mock('../../../contexts/slide-browser-context', () => ({
  useSlideBrowser: () => useSlideBrowserMock(),
}));

vi.mock('./use-slide-outline-text-editing', () => ({
  useSlideOutlineTextEditing: () => useSlideOutlineTextEditingMock(),
}));

describe('useOutlineView', () => {
  beforeEach(() => {
    useNavigationMock.mockReturnValue({
      currentPresentation: { id: 'presentation-1', entityType: 'presentation', kind: 'canvas' },
      currentPresentationId: 'presentation-1',
      currentOutputPresentationId: 'presentation-1',
      isDetachedPresentationBrowser: false,
    });
    useSlidesMock.mockReturnValue({
      slides: [
        { id: 'slide-1', order: 0 },
        { id: 'slide-2', order: 1 },
      ],
      currentSlideIndex: 0,
      liveSlideIndex: 0,
      slideElementsById: new Map([
        ['slide-1', []],
        ['slide-2', []],
      ]),
      setCurrentSlideIndex: vi.fn(),
    });
    useSlideBrowserMock.mockReturnValue({
      setSlideBrowserMode: vi.fn(),
    });
    useSlideOutlineTextEditingMock.mockReturnValue({
      updateText: vi.fn(),
    });
  });

  it('activates the live slide when selecting outline rows', () => {
    const activateSlide = vi.fn();
    const setCurrentSlideIndex = vi.fn();
    useSlidesMock.mockReturnValue({
      slides: [
        { id: 'slide-1', order: 0 },
        { id: 'slide-2', order: 1 },
      ],
      currentSlideIndex: 0,
      liveSlideIndex: 0,
      slideElementsById: new Map([
        ['slide-1', []],
        ['slide-2', []],
      ]),
      activateSlide,
      setCurrentSlideIndex,
    });

    const { result } = renderHook(() => useOutlineView());

    act(() => {
      result.current.selectSlide(1);
    });

    expect(activateSlide).toHaveBeenCalledWith(1);
    expect(setCurrentSlideIndex).not.toHaveBeenCalled();
  });

  it('opens focus mode from outline rows without activating the live slide', () => {
    const activateSlide = vi.fn();
    const setCurrentSlideIndex = vi.fn();
    const setSlideBrowserMode = vi.fn();
    useSlidesMock.mockReturnValue({
      slides: [
        { id: 'slide-1', order: 0 },
        { id: 'slide-2', order: 1 },
      ],
      currentSlideIndex: 0,
      liveSlideIndex: 0,
      slideElementsById: new Map([
        ['slide-1', []],
        ['slide-2', []],
      ]),
      activateSlide,
      setCurrentSlideIndex,
    });
    useSlideBrowserMock.mockReturnValue({
      setSlideBrowserMode,
    });

    const { result } = renderHook(() => useOutlineView());

    act(() => {
      result.current.openSlide(1);
    });

    expect(setCurrentSlideIndex).toHaveBeenCalledWith(1);
    expect(setSlideBrowserMode).toHaveBeenCalledWith('focus');
    expect(activateSlide).not.toHaveBeenCalled();
  });
});
