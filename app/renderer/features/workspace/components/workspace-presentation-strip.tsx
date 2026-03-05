import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';

export function WorkspacePresentationStrip() {
  const { currentPresentation } = useNavigation();
  const { slides } = useSlides();

  return (
    <header className="flex h-8 items-center gap-3 border-b border-stroke bg-surface-1/70 px-3">
      <span className="truncate text-[12px] font-medium text-text-primary" title={currentPresentation?.title ?? 'No presentation selected'}>
        {currentPresentation?.title ?? 'No presentation selected'}
      </span>
      <span className="ml-auto shrink-0 text-[11px] text-text-muted tabular-nums">
        {slides.length} slide{slides.length === 1 ? '' : 's'}
      </span>
    </header>
  );
}
