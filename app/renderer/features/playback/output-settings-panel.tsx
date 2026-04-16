import { useCallback, useState } from 'react';
import { FieldCheckbox as CheckboxField, FieldInput } from '../../components/form/field';
import { useNdi } from '../../contexts/ndi-context';

export function OutputSettingsPanel() {
  const { state: { outputState, outputConfigs, diagnostics }, actions: { setOutputEnabled, updateOutputConfig } } = useNdi();
  const config = outputConfigs.audience;
  const [senderNameDraft, setSenderNameDraft] = useState(config.senderName);

  function handleSetOutputEnabled(enabled: boolean) {
    setOutputEnabled('audience', enabled);
  }

  function handleCommitSenderName() {
    if (senderNameDraft.trim() && senderNameDraft !== config.senderName) {
      updateOutputConfig('audience', { senderName: senderNameDraft.trim() });
    }
  }

  const handleSetWithAlpha = useCallback((withAlpha: boolean) => {
    updateOutputConfig('audience', { withAlpha });
  }, [updateOutputConfig]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 border-b border-primary pb-5">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">Audience screen</h2>
        </header>
        <p className="text-sm text-tertiary">System display output is not wired yet.</p>
      </section>

      <section className="flex flex-col gap-3 border-b border-primary pb-5">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">Audience NDI</h2>
        </header>
        <CheckboxField checked={outputState.audience} label="Enabled" onChange={handleSetOutputEnabled} />
        <div className="flex flex-col gap-3">
          <FieldInput label="Sender name" value={senderNameDraft} onChange={setSenderNameDraft} onBlur={handleCommitSenderName} wide />
        </div>
        <CheckboxField checked={config.withAlpha} label="Include alpha channel" onChange={handleSetWithAlpha} />
        <p className="text-sm text-tertiary">
          Leave this off for normal audience playback. In NDI Studio Monitor, also disable `Show the NDI source&apos;s Alpha Channel`
          unless you intentionally want to view the matte.
        </p>
      </section>

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
