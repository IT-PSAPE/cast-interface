import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './index';

function ControlledSegmentedHarness() {
  const [value, setValue] = useState<string | string[]>('left');

  return (
    <SegmentedControl.Root value={value} onValueChange={setValue} label="Controlled segmented control">
      <SegmentedControl.Label value="left">Left</SegmentedControl.Label>
      <SegmentedControl.Label value="right">Right</SegmentedControl.Label>
    </SegmentedControl.Root>
  );
}

describe('SegmentedControl', () => {
  it('supports uncontrolled single selection', () => {
    render(
      <SegmentedControl.Root defaultValue="left" label="Single segmented control">
        <SegmentedControl.Label value="left">Left</SegmentedControl.Label>
        <SegmentedControl.Label value="right">Right</SegmentedControl.Label>
      </SegmentedControl.Root>,
    );

    const left = screen.getByRole('button', { name: 'Left' });
    const right = screen.getByRole('button', { name: 'Right' });

    expect(left).toHaveAttribute('aria-pressed', 'true');
    expect(right).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(right);

    expect(left).toHaveAttribute('aria-pressed', 'false');
    expect(right).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports uncontrolled multiple selection', () => {
    render(
      <SegmentedControl.Root defaultValue={['bold']} selectionMode="multiple" label="Multiple segmented control">
        <SegmentedControl.Label value="bold">Bold</SegmentedControl.Label>
        <SegmentedControl.Label value="italic">Italic</SegmentedControl.Label>
      </SegmentedControl.Root>,
    );

    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });

    fireEvent.click(italic);

    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(italic).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports controlled state updates', () => {
    render(<ControlledSegmentedHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Right' }));

    expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'true');
  });
});
