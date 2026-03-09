import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useLibraryPanelState } from '../contexts/library-panel-context';

export function LibraryHeader() {
  const { currentLibraryBundle } = useNavigation();
  const { setLibraryPanelView } = useLibraryPanelState();

  function handleBack() { setLibraryPanelView('libraries'); }

  if (!currentLibraryBundle) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border-primary px-3 py-2">
      <IconButton label="Back to libraries" onClick={handleBack} className="h-6 w-6 border-transparent bg-transparent">
        <Icon.chevron_left size={14} strokeWidth={2} />
      </IconButton>
      <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">{currentLibraryBundle.library.name}</span>
    </div>
  );
}
