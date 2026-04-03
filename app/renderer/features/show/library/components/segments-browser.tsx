import { FolderPlus } from 'lucide-react';
import { IconButton } from '../../../../components/controls/icon-button';
import { SectionHeader } from '../../../../components/display/section-header';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useLibraryBrowser } from '../contexts/library-browser-context';
import { useLibraryPanelState } from '../contexts/library-panel-context';
import { PlaylistSegmentGroup } from './playlist-segment-group';

export function SegmentsBrowser() {
  const { createSegment } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();
  const { state } = useLibraryBrowser();

  function handleNewSegment() { void createSegment(); }

  if (libraryPanelView !== 'playlist') return null;
  if (!state.selectedTree) {
    return <div className="grid h-full min-h-0 place-items-center p-4 text-sm text-text-tertiary">Select a playlist</div>;
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <SectionHeader.Root>
        <SectionHeader.Body>
          <span className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Segments</span>
        </SectionHeader.Body>
        <SectionHeader.Trailing>
          <IconButton label="New segment" onClick={handleNewSegment}>
            <FolderPlus size={14} strokeWidth={1.75} />
          </IconButton>
        </SectionHeader.Trailing>
      </SectionHeader.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1">
        {state.selectedTree.segments.map((segment) => <PlaylistSegmentGroup key={segment.segment.id} segment={segment} />)}
      </div>
    </section>
  );
}
