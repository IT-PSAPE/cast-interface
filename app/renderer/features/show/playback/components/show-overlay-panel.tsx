import { OverlayBinPanel } from '../../resources/components/overlay-bin-panel';

export function ShowOverlayPanel() {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <OverlayBinPanel filterText="" />
    </div>
  );
}
