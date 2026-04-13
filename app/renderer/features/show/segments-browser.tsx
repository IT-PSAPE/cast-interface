import { FolderPlus } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SectionHeader } from '../../components/display/section-header';
import { Panel } from '../../components/panel';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';
import { useLibraryPanelState } from './library-panel-context';
import { PlaylistSegmentGroup } from './playlist-segment-group';

export function SegmentsBrowser() {
  const { createSegment } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();
  const { state } = useLibraryBrowser();

  function handleNewSegment() { void createSegment(); }

  if (libraryPanelView !== 'playlist') return null;
  if (!state.selectedTree) {
    return <div className="grid h-full min-h-0 place-items-center p-4 text-sm text-tertiary">Select a playlist</div>;
  }

  return (
    <Panel.Root as="section">
      <SectionHeader.Root>
        <SectionHeader.Body>
          <span className="text-sm font-semibold uppercase tracking-wider text-tertiary">Segments</span>
        </SectionHeader.Body>
        <SectionHeader.Trailing>
          <Button.Icon label="New segment" onClick={handleNewSegment}>
            <FolderPlus />
          </Button.Icon>
        </SectionHeader.Trailing>
      </SectionHeader.Root>

      <Panel.Body className="px-1.5 py-1.5 space-y-1">
        {state.selectedTree.segments.map((segment) => <PlaylistSegmentGroup key={segment.segment.id} segment={segment} />)}
      </Panel.Body>
    </Panel.Root>
  );
}
