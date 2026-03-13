import { useCast } from '../contexts/cast-context';
import { useNdi } from '../contexts/ndi-context';

export function StatusBar() {
  const { statusText } = useCast();
  const { outputState } = useNdi();

  return (
    <div
      data-ui-region="status-bar"
      className="border-t border-border-primary bg-background-primary/60 px-2 py-1 flex items-center gap-3 text-sm"
    >
      <span className="text-text-secondary">{statusText}</span>

      <div className="ml-auto flex items-center gap-2 text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className={`inline-block size-1.5 rounded-full ${outputState.audience ? 'bg-green-500' : 'bg-red-500'}`} />
          Audience
        </span>
      </div>
    </div>
  );
}
