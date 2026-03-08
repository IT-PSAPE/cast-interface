import { Button } from '../../../components/button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { SlideBrowserModeControl } from './slide-browser-mode-control';

export function SlideBrowserToolbar() {
  const { createSlide } = useSlides();
  const { currentPresentation } = useNavigation();

  function handleAddSlide() {
    if (!currentPresentation) return;
    void createSlide();
  }

  return (
    <footer className="flex items-center gap-2 border-t border-border-primary bg-background-primary_alt/80 px-2 py-1.5">
      <Button onClick={handleAddSlide} disabled={!currentPresentation} className="grid h-7 w-7 place-items-center p-0 text-[16px] leading-none">
        <span aria-hidden="true">+</span>
        <span className="sr-only">Add slide</span>
      </Button>

      <div className="ml-auto">
        <SlideBrowserModeControl />
      </div>
    </footer>
  );
}
