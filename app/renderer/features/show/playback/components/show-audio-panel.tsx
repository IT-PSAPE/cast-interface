import { useRef } from 'react';
import { IconGroup } from '@renderer/components/icon-group';
import { CirclePause, CirclePlay, Plus, Repeat, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '../../../../components/controls/button';
import { useElements } from '../../../../contexts/element/element-context';
import { useShowAudio } from '../contexts/show-audio-context';
import { formatAudioTime } from '../utils/format-audio-time';
import { ShowAudioRow } from './show-audio-row';

export function ShowAudioPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { importMedia } = useElements();
  const { actions, state } = useShowAudio();

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return;
    void importMedia(event.target.files);
    event.target.value = '';
  }

  const currentTrackLabel = state.currentAudioAsset?.name ?? 'No audio selected';
  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  function handleSeekChange(event: React.ChangeEvent<HTMLInputElement>) {
    actions.seekTo(Number(event.target.value));
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid gap-2 border-b border-border-primary px-2 py-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-text-primary">{currentTrackLabel}</div>
            <div className="text-xs text-text-tertiary">Now playing</div>
          </div>
          <Button label="Import audio" size="icon-sm" variant="ghost" onClick={handleImportClick}>
            <Plus size={14} strokeWidth={1.75} />
          </Button>
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
          <div className="flex items-center justify-between text-xs tabular-nums text-text-tertiary">
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
              className={state.loopEnabled ? 'text-text-primary' : ''}
            >
              <Repeat size={14} strokeWidth={1.75} />
            </IconGroup.Item>
          </IconGroup.Root>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleImportChange}
          className="hidden"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {state.audioAssets.length === 0 ? (
          <div className="grid h-full place-items-center rounded border border-border-primary bg-background-primary/40 px-4 text-center text-sm text-text-tertiary">
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
      </div>
    </div>
  );
}
