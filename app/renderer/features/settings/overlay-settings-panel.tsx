import { useEffect, useState } from 'react';
import { FieldInput } from '../../components/form/field-input';
import { FieldSelect } from '../../components/form/field-select';
import { useOverlayDefaults } from '../../contexts/overlay-defaults-context';
import { SettingsSection } from './settings-section';

const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'fade', label: 'Fade' },
  { value: 'pulse', label: 'Pulse' },
];

export function OverlaySettingsPanel() {
  const { overlayDefaults, updateOverlayDefaults } = useOverlayDefaults();
  const [durationDraft, setDurationDraft] = useState(String(overlayDefaults.durationMs));
  const [autoClearDraft, setAutoClearDraft] = useState(
    overlayDefaults.autoClearDurationMs == null ? '' : String(overlayDefaults.autoClearDurationMs),
  );

  useEffect(() => {
    setDurationDraft(String(overlayDefaults.durationMs));
    setAutoClearDraft(overlayDefaults.autoClearDurationMs == null ? '' : String(overlayDefaults.autoClearDurationMs));
  }, [overlayDefaults.autoClearDurationMs, overlayDefaults.durationMs]);

  function handleAnimationKindChange(value: string) {
    if (value === 'none' || value === 'dissolve' || value === 'fade' || value === 'pulse') {
      updateOverlayDefaults({ animationKind: value });
    }
  }

  function handleDurationBlur() {
    const parsed = Number(durationDraft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDurationDraft(String(overlayDefaults.durationMs));
      return;
    }
    updateOverlayDefaults({ durationMs: Math.round(parsed) });
  }

  function handleAutoClearBlur() {
    if (autoClearDraft.trim().length === 0) {
      updateOverlayDefaults({ autoClearDurationMs: null });
      return;
    }
    const parsed = Number(autoClearDraft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setAutoClearDraft(overlayDefaults.autoClearDurationMs == null ? '' : String(overlayDefaults.autoClearDurationMs));
      return;
    }
    updateOverlayDefaults({ autoClearDurationMs: Math.round(parsed) });
  }

  return (
    <div className="grid gap-6">
      <SettingsSection title="Overlay defaults">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldSelect
            label="Animation"
            value={overlayDefaults.animationKind}
            onChange={handleAnimationKindChange}
            options={ANIMATION_OPTIONS}
          />
          <FieldInput
            type="number"
            label="Transition duration (ms)"
            value={durationDraft}
            onChange={setDurationDraft}
            onBlur={handleDurationBlur}
          />
          <FieldInput
            type="number"
            label="Auto-clear after (ms)"
            value={autoClearDraft}
            onChange={setAutoClearDraft}
            onBlur={handleAutoClearBlur}
            wide
          />
        </div>
      </SettingsSection>
    </div>
  );
}
