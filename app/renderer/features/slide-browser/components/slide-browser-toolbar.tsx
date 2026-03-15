import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
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
    <footer className="flex items-center gap-2 border-t border-border-primary bg-primary/80 px-2 py-1">
      <IconButton label="Add slide" disabled={!currentPresentation} onClick={handleAddSlide}>
        <Icon.plus />
      </IconButton>

      <div className="ml-auto">
        <SlideBrowserModeControl />
      </div>
    </footer>
  );
}
