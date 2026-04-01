import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Slide, SlideElement } from '@core/types';
import { LyricEditorModal } from './lyric-editor-modal';

const useNavigationMock = vi.fn();
const useSlidesMock = vi.fn();
const useProjectContentMock = vi.fn();
const useCastMock = vi.fn();

vi.mock('../../../contexts/navigation-context', () => ({
  useNavigation: () => useNavigationMock(),
}));

vi.mock('../../../contexts/slide-context', () => ({
  useSlides: () => useSlidesMock(),
}));

vi.mock('../../../contexts/use-project-content', () => ({
  useProjectContent: () => useProjectContentMock(),
}));

vi.mock('../../../contexts/cast-context', () => ({
  useCast: () => useCastMock(),
}));

function createSlide(id: string, order: number): Slide {
  return {
    id,
    deckId: null,
    lyricId: 'lyric-1',
    width: 1920,
    height: 1080,
    notes: '',
    order,
    createdAt: '',
    updatedAt: '',
  };
}

function createTextElement(id: string, slideId: string, text: string): SlideElement {
  return {
    id,
    slideId,
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    layer: 'content',
    payload: {
      text,
      fontFamily: 'Avenir Next',
      fontSize: 72,
      color: '#FFFFFF',
      alignment: 'center',
      weight: '700',
    },
    createdAt: '',
    updatedAt: '',
  };
}

describe('LyricEditorModal', () => {
  const mutate = vi.fn(async (action: () => Promise<unknown> | unknown) => action());
  const setStatusText = vi.fn();
  const onClose = vi.fn();
  const deleteSlide = vi.fn();
  const updateElement = vi.fn();
  const createSlideApi = vi.fn();
  const createElement = vi.fn();
  const setSlideOrder = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = '<div id="overlay-root"></div>';
    mutate.mockClear();
    setStatusText.mockClear();
    onClose.mockClear();
    deleteSlide.mockReset();
    updateElement.mockReset();
    createSlideApi.mockReset();
    createElement.mockReset();
    setSlideOrder.mockReset();

    useNavigationMock.mockReturnValue({
      currentContentItem: { id: 'lyric-1', title: 'Song', type: 'lyric', order: 0, createdAt: '', updatedAt: '' },
    });
    useSlidesMock.mockReturnValue({
      slides: [createSlide('slide-1', 0), createSlide('slide-2', 1)],
    });
    useProjectContentMock.mockReturnValue({
      slideElementsBySlideId: new Map([
        ['slide-1', [createTextElement('text-1', 'slide-1', 'Verse 1')]],
        ['slide-2', [createTextElement('text-2', 'slide-2', 'Verse 2')]],
      ]),
    });
    useCastMock.mockReturnValue({
      mutate,
      setStatusText,
    });

    window.castApi = {
      deleteSlide,
      updateElement,
      createSlide: createSlideApi,
      createElement,
      setSlideOrder,
    } as unknown as typeof window.castApi;
  });

  it('removes deleted rows from the lyric model when saving', async () => {
    render(<LyricEditorModal isOpen onClose={onClose} />);

    fireEvent.contextMenu(screen.getAllByLabelText(/Open actions for slide row/i)[1]);
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(deleteSlide).toHaveBeenCalledWith('slide-2');
    });

    expect(setSlideOrder).toHaveBeenCalledWith({ slideId: 'slide-1', newOrder: 0 });
    expect(updateElement).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setStatusText).toHaveBeenCalledWith('Saved lyrics');
  });

  it('creates and saves new lyric rows', async () => {
    createSlideApi.mockResolvedValue({
      slides: [createSlide('slide-1', 0), createSlide('slide-2', 1), createSlide('slide-3', 2)],
      slideElements: [createTextElement('text-3', 'slide-3', 'Verse line one\nVerse line two')],
    });

    render(<LyricEditorModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByText('Add Row'));
    fireEvent.change(screen.getAllByPlaceholderText('Write lyrics...')[2], { target: { value: 'Bridge' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(createSlideApi).toHaveBeenCalledWith({ lyricId: 'lyric-1' });
    });

    expect(updateElement).toHaveBeenCalledWith({
      id: 'text-3',
      payload: expect.objectContaining({ text: 'Bridge' }),
    });
    expect(setSlideOrder).toHaveBeenNthCalledWith(3, { slideId: 'slide-3', newOrder: 2 });
    expect(createElement).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('duplicates a row from the handle menu', async () => {
    render(<LyricEditorModal isOpen onClose={onClose} />);

    fireEvent.contextMenu(screen.getAllByLabelText(/Open actions for slide row/i)[0]);
    fireEvent.click(screen.getByText('Duplicate'));

    const textareas = screen.getAllByPlaceholderText('Write lyrics...');
    expect(textareas).toHaveLength(3);
    expect((textareas[1] as HTMLTextAreaElement).value).toBe('Verse 1');
  });

  it('reorders rows by dragging the left handle', async () => {
    render(<LyricEditorModal isOpen onClose={onClose} />);

    const handles = screen.getAllByLabelText(/Open actions for slide row/i);
    const dragData = {
      effectAllowed: 'all',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn(() => 'slide-2'),
    };

    fireEvent.dragStart(handles[1], { dataTransfer: dragData });
    fireEvent.dragOver(screen.getByTestId('lyric-editor-drop-before-slide-1'), { dataTransfer: dragData });
    fireEvent.drop(screen.getByTestId('lyric-editor-drop-before-slide-1'), { dataTransfer: dragData });

    const textareas = screen.getAllByPlaceholderText('Write lyrics...');
    expect((textareas[0] as HTMLTextAreaElement).value).toBe('Verse 2');
    expect((textareas[1] as HTMLTextAreaElement).value).toBe('Verse 1');
  });
});
