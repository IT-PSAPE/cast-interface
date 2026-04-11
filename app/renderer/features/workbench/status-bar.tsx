import { cv } from '@renderer/utils/cv';
import { useCast } from '../../contexts/cast-context';
import { useNdi } from '../../contexts/ndi-context';

const indicatorStyles = cv({
  base: 'inline-block size-1.5 rounded-full',
  variants: {
    active: {
      true: ['bg-green-500'],
      false: ['bg-red-500'],
    },
  },
});

export function StatusBar() {
  const { statusText } = useCast();
  const { state: { diagnostics, outputState } } = useNdi();
  const audienceStateLabel = diagnostics?.sourceStatus === 'live' ? 'Audience live' : 'Audience idle';

  return (
    <div
      data-ui-region="status-bar"
      className="border-t border-primary bg-primary/60 px-2 py-1 flex items-center gap-3 text-sm"
    >
      <span className="text-secondary">{statusText}</span>

      <div className="ml-auto flex items-center gap-2 text-tertiary">
        <span className="flex items-center gap-1">
          <span className={indicatorStyles({ active: outputState.audience })} />
          {audienceStateLabel}
        </span>
      </div>
    </div>
  );
}
