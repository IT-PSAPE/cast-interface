import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useLibraryPanelState } from '../contexts/library-panel-context';

export function LibraryHeader() {
  const { activeBundle } = useNavigation();
  const { setLibraryPanelView } = useLibraryPanelState();

  function handleBack() { setLibraryPanelView('libraries'); }

  if (!activeBundle) return null;

  return (
    <div className="flex items-center gap-2 border-b border-stroke px-3 py-2">
      <IconButton label="Back to libraries" onClick={handleBack} className="h-6 w-6 border-transparent bg-transparent">
        <span aria-hidden="true">‹</span>
      </IconButton>
      <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">{activeBundle.library.name}</span>
    </div>
  );
}
