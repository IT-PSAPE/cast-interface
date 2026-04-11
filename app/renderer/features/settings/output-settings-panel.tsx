import { useCallback, useState } from 'react';
import { CheckboxField } from '../../components/form/checkbox-field';
import { FieldInput } from '../../components/form/field-input';
import { useNdi } from '../../contexts/ndi-context';
import { SettingsSection } from './settings-section';

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
    <div className="grid gap-6">
      <SettingsSection title="Audience screen">
        <p className="text-sm text-tertiary">System display output is not wired yet.</p>
      </SettingsSection>
      <SettingsSection title="Audience NDI">
        <CheckboxField
          checked={outputState.audience}
          label="Enabled"
          onChange={handleSetOutputEnabled}
        />

        <div className="grid gap-3">
          <FieldInput
            label="Sender name"
            value={senderNameDraft}
            onChange={setSenderNameDraft}
            onBlur={handleCommitSenderName}
            wide
          />
        </div>

        <CheckboxField
          checked={config.withAlpha}
          label="Include alpha channel"
          onChange={handleSetWithAlpha}
        />
        <p className="text-sm text-tertiary">
          Leave this off for normal audience playback. In NDI Studio Monitor, also disable `Show the NDI source's Alpha Channel`
          unless you intentionally want to view the matte.
        </p>
      </SettingsSection>

      <SettingsSection title="NDI diagnostics">
        {diagnostics ? (
          <div className="grid gap-1 text-sm text-secondary">
            <div>Runtime: {diagnostics.runtimeLoaded ? (diagnostics.runtimePath ?? 'Loaded') : 'Not loaded'}</div>
            <div>Status: {diagnostics.sourceStatus}</div>
            {diagnostics.activeSender && (
              <div>Sender: {diagnostics.activeSender.senderName} ({diagnostics.activeSender.width}x{diagnostics.activeSender.height})</div>
            )}
            {diagnostics.lastError && (
              <div className="text-red-400">Error: {diagnostics.lastError}</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-tertiary">Waiting for NDI diagnostics.</p>
        )}
      </SettingsSection>
    </div>
  );
}
