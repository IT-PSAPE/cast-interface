import { IconGroup } from '@renderer/components/icon-group';
import { Panel } from '@renderer/components/panel';
import { CirclePause, CirclePlay, Plus, Repeat, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { FileTrigger } from '../../components/form/file-trigger';
import { useElements } from '../../contexts/element/element-context';
import { useShowAudio } from './show-audio-context';
import { formatAudioTime } from './format-audio-time';
import { ShowAudioRow } from './show-audio-row';

export function ShowAudioPanel() {
  const { importMedia } = useElements();
  const { actions, state } = useShowAudio();

  function handleImportSelect(files: FileList) {
    void importMedia(files);
  }

  const currentTrackLabel = state.currentAudioAsset?.name ?? 'No audio selected';
  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  function handleSeekChange(event: React.ChangeEvent<HTMLInputElement>) {
    actions.seekTo(Number(event.target.value));
  }

  return (
    <Panel.Root>
      <div className="grid gap-2 border-b border-primary px-2 py-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-primary">{currentTrackLabel}</div>
            <div className="text-xs text-tertiary">Now playing</div>
          </div>
          <FileTrigger.Root accept="audio/*" multiple onSelect={handleImportSelect} className="relative inline-flex">
            <Button.Icon label="Import audio" size="sm" variant="ghost">
              <Plus size={14} strokeWidth={1.75} />
            </Button.Icon>
          </FileTrigger.Root>
        </div>

        <div className="grid gap-1">
          <input
            type="range"
            min={0}
            max={state.duration || 0}
            step={0.1}
            value={Math.min(state.currentTime, state.duration || 0)}
            onChange={handleSeekChange}
            disabled={state.audioAssets.length === 0 || state.duration === 0}
            aria-label="Playback position"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-text-primary [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-3px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-text-primary"
            style={{
              background: `linear-gradient(to right, var(--color-brand-400) 0%, var(--color-brand-400) ${progressPercent}%, var(--color-background-tertiary) ${progressPercent}%, var(--color-background-tertiary) 100%)`,
            }}
          />
          <div className="flex items-center justify-between text-xs tabular-nums text-tertiary">
            <span>{formatAudioTime(state.currentTime)}</span>
            <span>{formatAudioTime(state.duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <IconGroup.Root>
            <IconGroup.Item aria-label="Previous audio" title="Previous audio" onClick={actions.playPrevious} disabled={state.audioAssets.length === 0}>
              <SkipBack size={14} strokeWidth={1.75} />
            </IconGroup.Item>
            <IconGroup.Item
              aria-label={state.isPlaying ? 'Pause audio' : 'Play audio'}
              title={state.isPlaying ? 'Pause audio' : 'Play audio'}
              onClick={actions.togglePlayback}
              disabled={state.audioAssets.length === 0}
            >
              {state.isPlaying ? <CirclePause size={16} strokeWidth={1.75} /> : <CirclePlay size={16} strokeWidth={1.75} />}
            </IconGroup.Item>
            <IconGroup.Item aria-label="Next audio" title="Next audio" onClick={actions.playNext} disabled={state.audioAssets.length === 0}>
              <SkipForward size={14} strokeWidth={1.75} />
            </IconGroup.Item>
            <IconGroup.Item
              aria-label={state.loopEnabled ? 'Disable audio loop' : 'Enable audio loop'}
              title={state.loopEnabled ? 'Disable audio loop' : 'Enable audio loop'}
              onClick={actions.toggleLoop}
              disabled={state.audioAssets.length === 0}
              className={state.loopEnabled ? 'text-primary' : ''}
            >
              <Repeat size={14} strokeWidth={1.75} />
            </IconGroup.Item>
          </IconGroup.Root>
        </div>
      </div>

      <Panel.Body className="p-2">
        {state.audioAssets.length === 0 ? (
          <div className="grid h-full place-items-center rounded border border-primary bg-primary/40 px-4 text-center text-sm text-tertiary">
            Import audio to build a reusable app-wide audio list.
          </div>
        ) : (
          <div className="grid content-start gap-1">
            {state.audioAssets.map((asset) => (
              <ShowAudioRow
                key={asset.id}
                asset={asset}
                isActive={state.currentAudioAssetId === asset.id}
                isPlaying={state.currentAudioAssetId === asset.id && state.isPlaying}
                onSelect={actions.selectAudio}
              />
            ))}
          </div>
        )}
      </Panel.Body>
    </Panel.Root>
  );
}
