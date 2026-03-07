import { useCast } from '../contexts/cast-context';
import { useNdi } from '../contexts/ndi-context';

export function StatusBar() {
  const { statusText } = useCast();
  const { outputState } = useNdi();

  return (
    <div className="border-t border-stroke bg-surface-0/60 px-2 py-1 flex items-center gap-3 text-[11px]">
      <span className="text-text-secondary">{statusText}</span>

      <div className="ml-auto flex items-center gap-2 text-text-muted">
        <span className="flex items-center gap-1">
          <span className={`inline-block size-1.5 rounded-full ${outputState.audience ? 'bg-live' : 'bg-error'}`} />
          Audience
        </span>
      </div>
    </div>
  );
}
