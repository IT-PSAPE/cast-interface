import { FolderPlus } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { Panel } from '../../components/layout/panel';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';
import { useLibraryPanelState } from './library-panel-context';
import { PlaylistSegmentGroup } from './playlist-segment-group';
import { Label } from '@renderer/components/display/text';
import { Accordion } from '@renderer/components/display/accordion';

export function SegmentsBrowser() {
  const { createSegment } = useNavigation();
  const { libraryPanelView, expandedSegmentIds, setExpandedSegmentIds } = useLibraryPanelState();
  const { state } = useLibraryBrowser();

  function handleNewSegment() { void createSegment(); }

  if (libraryPanelView !== 'playlist') return null;
  if (!state.selectedTree) {
    return <div className="grid h-full min-h-0 place-items-center p-4 text-sm text-tertiary">Select a playlist</div>;
  }

  return (
    <Panel as="section">
      <Panel.Header>
        <Label.xs className="text-tertiary mr-auto">Segments</Label.xs>
        <Button.Icon label="New segment" onClick={handleNewSegment}>
          <FolderPlus />
        </Button.Icon>
      </Panel.Header>

      <Panel.Body>
        <Accordion type='multiple' value={expandedSegmentIds} onValueChange={handleSegmentValueChange}>
          {state.selectedTree.segments.map((segment) => <PlaylistSegmentGroup key={segment.segment.id} segment={segment} />)}
        </Accordion>
      </Panel.Body>
    </Panel>
  );

  function handleSegmentValueChange(value: string | string[]) {
    setExpandedSegmentIds(Array.isArray(value) ? value : value ? [value] : []);
  }
}
