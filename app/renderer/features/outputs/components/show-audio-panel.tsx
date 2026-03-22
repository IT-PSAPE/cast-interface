import { useRef } from 'react';
import { IconGroup } from '@renderer/components/icon-group';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useElements } from '../../../contexts/element-context';
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
  const timeLabel = `${formatAudioTime(state.currentTime)} / ${formatAudioTime(state.duration)}`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border-primary px-2 py-2">
        <IconGroup.Root>
          <IconGroup.Item aria-label="Previous audio" title="Previous audio" onClick={actions.playPrevious} disabled={state.audioAssets.length === 0}>
            <Icon.skip_back size={14} strokeWidth={1.75} />
          </IconGroup.Item>
          <IconGroup.Item
            aria-label={state.isPlaying ? 'Pause audio' : 'Play audio'}
            title={state.isPlaying ? 'Pause audio' : 'Play audio'}
            onClick={actions.togglePlayback}
            disabled={state.audioAssets.length === 0}
          >
            {state.isPlaying ? <Icon.pause_circle size={16} strokeWidth={1.75} /> : <Icon.play_circle size={16} strokeWidth={1.75} />}
          </IconGroup.Item>
          <IconGroup.Item aria-label="Next audio" title="Next audio" onClick={actions.playNext} disabled={state.audioAssets.length === 0}>
            <Icon.skip_forward size={14} strokeWidth={1.75} />
          </IconGroup.Item>
          <IconGroup.Item
            aria-label={state.loopEnabled ? 'Disable audio loop' : 'Enable audio loop'}
            title={state.loopEnabled ? 'Disable audio loop' : 'Enable audio loop'}
            onClick={actions.toggleLoop}
            disabled={state.audioAssets.length === 0}
            className={state.loopEnabled ? 'text-text-primary' : ''}
          >
            <Icon.repeat_01 size={14} strokeWidth={1.75} />
          </IconGroup.Item>
        </IconGroup.Root>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text-primary">{currentTrackLabel}</div>
          <div className="text-xs tabular-nums text-text-tertiary">{timeLabel}</div>
        </div>
        <IconButton label="Import audio" size="sm" variant="ghost" onClick={handleImportClick}>
          <Icon.plus size={14} strokeWidth={1.75} />
        </IconButton>
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
