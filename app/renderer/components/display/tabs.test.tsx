import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './tabs';

function ControlledTabsHarness() {
  const [value, setValue] = useState('alpha');

  return (
    <Tabs.Root value={value} onValueChange={setValue}>
      <Tabs.List label="Controlled tabs">
        <Tabs.Trigger value="alpha">Alpha</Tabs.Trigger>
        <Tabs.Trigger value="beta">Beta</Tabs.Trigger>
        <Tabs.Indicator data-testid="tabs-indicator" />
      </Tabs.List>
      <Tabs.Panels>
        <Tabs.Panel value="alpha">Alpha panel</Tabs.Panel>
        <Tabs.Panel value="beta">Beta panel</Tabs.Panel>
      </Tabs.Panels>
    </Tabs.Root>
  );
}

describe('Tabs', () => {
  it('supports uncontrolled state and indicator updates', () => {
    render(
      <Tabs.Root defaultValue="alpha">
        <Tabs.List label="Demo tabs">
          <Tabs.Trigger value="alpha">Alpha</Tabs.Trigger>
          <Tabs.Trigger value="beta">Beta</Tabs.Trigger>
          <Tabs.Indicator data-testid="tabs-indicator" />
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel value="alpha">Alpha panel</Tabs.Panel>
          <Tabs.Panel value="beta">Beta panel</Tabs.Panel>
        </Tabs.Panels>
      </Tabs.Root>,
    );

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Alpha panel');
    expect(screen.getByTestId('tabs-indicator')).toHaveAttribute('data-active-value', 'alpha');

    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Beta panel');
    expect(screen.getByTestId('tabs-indicator')).toHaveAttribute('data-active-value', 'beta');
  });

  it('supports controlled state and manual activation', () => {
    render(
      <Tabs.Root defaultValue="alpha" activationMode="manual">
        <Tabs.List label="Manual tabs">
          <Tabs.Trigger value="alpha">Alpha</Tabs.Trigger>
          <Tabs.Trigger value="beta">Beta</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel value="alpha">Alpha panel</Tabs.Panel>
          <Tabs.Panel value="beta">Beta panel</Tabs.Panel>
        </Tabs.Panels>
      </Tabs.Root>,
    );

    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    const beta = screen.getByRole('tab', { name: 'Beta' });

    alpha.focus();
    fireEvent.keyDown(alpha, { key: 'ArrowRight' });

    expect(beta).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Alpha panel');

    fireEvent.click(beta);

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Beta panel');
  });

  it('supports controlled state updates', () => {
    render(<ControlledTabsHarness />);

    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Beta panel');
  });
});
