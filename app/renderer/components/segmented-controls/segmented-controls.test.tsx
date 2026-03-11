import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './index';

describe('SegmentedControl compound', () => {
  it('updates internal selection state when uncontrolled', () => {
    render(
      <SegmentedControl.Root defaultValue="show" aria-label="Views">
        <SegmentedControl.Label value="show">Show</SegmentedControl.Label>
        <SegmentedControl.Label value="slides">Slides</SegmentedControl.Label>
      </SegmentedControl.Root>
    );

    const showButton = screen.getByRole('button', { name: 'Show' });
    const slidesButton = screen.getByRole('button', { name: 'Slides' });

    expect(showButton.getAttribute('aria-pressed')).toBe('true');
    expect(slidesButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(slidesButton);

    expect(showButton.getAttribute('aria-pressed')).toBe('false');
    expect(slidesButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('emits next values from the root when controlled', () => {
    const onValueChange = vi.fn();

    render(
      <SegmentedControl.Root value="show" onValueChange={onValueChange} aria-label="Views">
        <SegmentedControl.Label value="show">Show</SegmentedControl.Label>
        <SegmentedControl.Label value="slides">Slides</SegmentedControl.Label>
      </SegmentedControl.Root>
    );

    const showButton = screen.getByRole('button', { name: 'Show' });
    const slidesButton = screen.getByRole('button', { name: 'Slides' });

    fireEvent.click(slidesButton);

    expect(onValueChange).toHaveBeenCalledWith('slides');
    expect(showButton.getAttribute('aria-pressed')).toBe('true');
    expect(slidesButton.getAttribute('aria-pressed')).toBe('false');
  });
});
