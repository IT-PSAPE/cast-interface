import { useShowAudio } from './show-audio-context';
import { ShowAudioRow } from './show-audio-row';

export function ShowAudioPanel() {
  const { actions, state } = useShowAudio();

  return (
    <section className="h-full min-h-0 overflow-auto p-2">
      <div className="flex min-h-full flex-col">
        {state.audioAssets.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded border border-primary bg-primary/40 px-4 text-center text-sm text-tertiary">
            Import audio to build a reusable app-wide audio list.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {state.audioAssets.map((asset) => (
              <ShowAudioRow
                key={asset.id}
                asset={asset}
                isActive={state.currentAudioAssetId === asset.id}
                onSelect={actions.selectAudio}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
