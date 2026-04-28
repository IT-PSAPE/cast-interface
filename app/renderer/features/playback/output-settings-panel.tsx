import { useCallback, useEffect, useState } from 'react';
import type { NdiOutputName } from '@core/types';
import { FieldCheckbox as CheckboxField, FieldInput } from '../../components/form/field';
import { useNdi } from '../../contexts/app-context';

const OUTPUT_TITLES: Record<NdiOutputName, string> = {
  audience: 'Audience NDI',
  stage: 'Stage NDI',
};

const OUTPUT_DESCRIPTIONS: Record<NdiOutputName, string | null> = {
  audience: null,
  stage: 'Output dedicated to a presenter / on-stage monitor. Renders the active stage layout selected from the Show screen.',
};

export function OutputSettingsPanel() {
  const { state: { diagnostics } } = useNdi();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 border-b border-primary pb-5">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">Audience screen</h2>
        </header>
        <p className="text-sm text-tertiary">System display output is not wired yet.</p>
      </section>

      <OutputControls name="audience" />
      <OutputControls name="stage" />

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">NDI diagnostics</h2>
        </header>
        {diagnostics ? (
          <div className="flex flex-col gap-1 text-sm text-secondary">
            <div>Runtime: {diagnostics.runtimeLoaded ? (diagnostics.runtimePath ?? 'Loaded') : 'Not loaded'}</div>
            <div>Status: {diagnostics.sourceStatus}</div>
            {diagnostics.activeSender ? (
              <div>Sender: {diagnostics.activeSender.senderName} ({diagnostics.activeSender.width}x{diagnostics.activeSender.height})</div>
            ) : null}
            {diagnostics.lastError ? (
              <div className="text-red-400">Error: {diagnostics.lastError}</div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-tertiary">Waiting for NDI diagnostics.</p>
        )}
      </section>
    </div>
  );
}

// Per-output controls block. Rendered once per `NdiOutputName` so audience and
// stage senders are configured side-by-side with identical UX.
function OutputControls({ name }: { name: NdiOutputName }) {
  const { state: { outputState, outputConfigs }, actions: { setOutputEnabled, updateOutputConfig } } = useNdi();
  const config = outputConfigs[name];
  const enabled = outputState[name];
  const [senderNameDraft, setSenderNameDraft] = useState(config.senderName);

  // Re-sync the input draft when the persisted name changes from elsewhere
  // (e.g. another window committing a rename).
  useEffect(() => {
    setSenderNameDraft(config.senderName);
  }, [config.senderName]);

  function handleSetOutputEnabled(value: boolean) {
    setOutputEnabled(name, value);
  }

  function handleCommitSenderName() {
    const trimmed = senderNameDraft.trim();
    if (trimmed && trimmed !== config.senderName) {
      updateOutputConfig(name, { senderName: trimmed });
    } else if (!trimmed) {
      setSenderNameDraft(config.senderName);
    }
  }

  const handleSetWithAlpha = useCallback((withAlpha: boolean) => {
    updateOutputConfig(name, { withAlpha });
  }, [name, updateOutputConfig]);

  const description = OUTPUT_DESCRIPTIONS[name];

  return (
    <section className="flex flex-col gap-3 border-b border-primary pb-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">{OUTPUT_TITLES[name]}</h2>
      </header>
      {description ? <p className="text-sm text-tertiary">{description}</p> : null}
      <CheckboxField checked={enabled} label="Enabled" onChange={handleSetOutputEnabled} />
      <div className="flex flex-col gap-3">
        <FieldInput label="Sender name" value={senderNameDraft} onChange={setSenderNameDraft} onBlur={handleCommitSenderName} wide />
      </div>
      <CheckboxField checked={config.withAlpha} label="Include alpha channel" onChange={handleSetWithAlpha} />
      <p className="text-sm text-tertiary">
        Leave alpha off for normal playback. In NDI Studio Monitor, also disable
        &quot;Show the NDI source&apos;s Alpha Channel&quot; unless you intentionally want to view the matte.
      </p>
    </section>
  );
}
