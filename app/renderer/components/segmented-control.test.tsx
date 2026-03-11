import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemLabel } from './segmented-control';

describe('SegmentedControl', () => {
  it('updates internal single-selection state when uncontrolled', () => {
    render(
      <SegmentedControl label="Views" selectionMode="single" defaultValue="show">
        <SegmentedControlItem value="show" title="Show">
          <SegmentedControlItemLabel>Show</SegmentedControlItemLabel>
        </SegmentedControlItem>
        <SegmentedControlItem value="slide-editor" title="Edit">
          <SegmentedControlItemLabel>Edit</SegmentedControlItemLabel>
        </SegmentedControlItem>
      </SegmentedControl>
    );

    const showButton = screen.getByRole('button', { name: 'Show' });
    const editButton = screen.getByRole('button', { name: 'Edit' });

    expect(showButton.getAttribute('aria-pressed')).toBe('true');
    expect(editButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(editButton);

    expect(showButton.getAttribute('aria-pressed')).toBe('false');
    expect(editButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('emits next values for controlled multiple-selection state', () => {
    const onValueChange = vi.fn();

    render(
      <SegmentedControl
        label="Panels"
        selectionMode="multiple"
        value={['left']}
        onValueChange={onValueChange}
      >
        <SegmentedControlItem value="left" title="Left">
          <SegmentedControlItemLabel>Left</SegmentedControlItemLabel>
        </SegmentedControlItem>
        <SegmentedControlItem value="right" title="Right">
          <SegmentedControlItemLabel>Right</SegmentedControlItemLabel>
        </SegmentedControlItem>
      </SegmentedControl>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));

    expect(onValueChange).toHaveBeenNthCalledWith(1, ['left', 'right']);
    expect(onValueChange).toHaveBeenNthCalledWith(2, []);
  });
});
