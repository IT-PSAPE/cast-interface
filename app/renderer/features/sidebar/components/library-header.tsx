import { useNavigation } from '../../../contexts/navigation-context';

export function LibraryHeader() {
  const { activeBundle, setSidebarStage } = useNavigation();

  function handleBack() { setSidebarStage('libraries'); }

  if (!activeBundle) return null;

  return (
    <div className="flex items-center gap-2 border-b border-stroke px-3 py-2">
      <button
        onClick={handleBack}
        className="cursor-pointer border-0 bg-transparent p-0 text-[12px] text-text-muted transition-colors hover:text-text-primary"
        aria-label="Back to libraries"
      >
        ‹
      </button>
      <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">{activeBundle.library.name}</span>
    </div>
  );
}
