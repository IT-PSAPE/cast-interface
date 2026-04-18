import { cv } from '@renderer/utils/cv';
import { LoaderCircle } from 'lucide-react';
import { useCast, useNdi } from '../../contexts/app-context';

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
  const { isRunningOperation, operationText, statusText } = useCast();
  const { state: { diagnostics, outputState } } = useNdi();
  const audienceStateLabel = diagnostics?.sourceStatus === 'live' ? 'Audience live' : 'Audience idle';
  const displayText = isRunningOperation ? operationText ?? 'Processing...' : statusText;

  return (
    <div
      data-ui-region="status-bar"
      className="border-t border-primary bg-primary/60 px-2 py-1 flex items-center gap-3 text-sm"
    >
      <span className="flex items-center gap-2 text-secondary">
        {isRunningOperation && <LoaderCircle size={14} className="animate-spin text-tertiary" />}
        {displayText}
      </span>

      <div className="ml-auto flex items-center gap-2 text-tertiary">
        <span className="flex items-center gap-1">
          <span className={indicatorStyles({ active: outputState.audience })} />
          {audienceStateLabel}
        </span>
      </div>
    </div>
  );
}
