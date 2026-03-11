import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FieldColor, FieldInput, FieldSelect, FieldTextarea } from './labeled-field';

describe('labeled-field controls', () => {
  it('emits changes from text and number inputs', () => {
    const onChange = vi.fn();

    render(<FieldInput value="12" onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '34' } });

    expect(onChange).toHaveBeenCalledWith('34');
  });

  it('emits changes from textarea controls', () => {
    const onChange = vi.fn();

    render(<FieldTextarea value="Hello" onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue('Hello'), { target: { value: 'Updated' } });

    expect(onChange).toHaveBeenCalledWith('Updated');
  });

  it('emits changes from select controls', () => {
    const onChange = vi.fn();

    render(
      <FieldSelect
        value="one"
        onChange={onChange}
        options={[
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ]}
      />
    );

    fireEvent.change(screen.getByDisplayValue('One'), { target: { value: 'two' } });

    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('renders color controls safely when the value is missing', () => {
    const onChange = vi.fn();

    render(<FieldColor value={undefined} onChange={onChange} />);

    expect(screen.getByDisplayValue('000000')).toBeTruthy();
  });
});
