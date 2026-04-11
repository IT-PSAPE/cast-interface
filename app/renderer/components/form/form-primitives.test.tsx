import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';
import { FileTrigger } from './file-trigger';

function ControlledCheckboxHarness() {
  const [checked, setChecked] = useState(false);

  return (
    <Checkbox.Root checked={checked} onCheckedChange={setChecked}>
      <Checkbox.Indicator />
      <Checkbox.Label>Enable captions</Checkbox.Label>
    </Checkbox.Root>
  );
}

describe('form primitives', () => {
  it('supports controlled checkbox state', () => {
    render(<ControlledCheckboxHarness />);

    const checkbox = screen.getByRole('checkbox', { name: 'Enable captions' });

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('forwards selected files from the file trigger', () => {
    const onSelect = vi.fn();
    const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });

    const { container } = render(
      <FileTrigger.Root accept="audio/*" multiple onSelect={onSelect}>
        <button type="button">Import audio</button>
      </FileTrigger.Root>,
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0][0]).toBe(file);
  });
});
