import { Plus } from 'lucide-react';
import type { PlaylistTree } from '@core/types';
import { ReacstButton } from '@renderer/components/controls/button';
import { ScrollArea } from '../../components/layout/scroll-area';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';
import { useLibraryPanelState } from './library-panel-context';
import { PlaylistSegmentGroup } from './playlist-segment-group';
import { Label } from '@renderer/components/display/text';
import { Accordion } from '@renderer/components/display/accordion';
import { EmptyState } from '../../components/display/empty-state';
import { RecastPanel } from '@renderer/components/layout/panel';

type SegmentList = PlaylistTree['segments'];

const EMPTY_SEGMENTS: SegmentList = [];

export function SegmentsBrowser() {
  const { createSegment } = useNavigation();
  const { libraryPanelView, expandedSegmentIds, setExpandedSegmentIds } = useLibraryPanelState();
  const { state } = useLibraryBrowser();

  const rawSegments = state.selectedTree?.segments ?? EMPTY_SEGMENTS;

  if (libraryPanelView !== 'playlist') return null;
  if (!state.selectedTree) {
    return <EmptyState.Root><EmptyState.Title>Select a playlist</EmptyState.Title></EmptyState.Root>;
  }

  function handleNewSegment() { void createSegment(); }

  return (
    <>
      <RecastPanel.Group>
        <RecastPanel.GroupTitle className='border-t'>
          <Label.xs className='mr-auto'>Segments</Label.xs>
          <ReacstButton.Icon onClick={handleNewSegment}>
            <Plus />
          </ReacstButton.Icon>
        </RecastPanel.GroupTitle>
      </RecastPanel.Group>

      <RecastPanel.Group>
        <ScrollArea.Root>
          <ScrollArea.Viewport>
            <Accordion type='multiple' value={expandedSegmentIds} onValueChange={handleSegmentValueChange}>
              {rawSegments.map((segment) => (
                <PlaylistSegmentGroup
                  key={segment.segment.id}
                  segment={segment}
                />
              ))}
            </Accordion>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar>
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </RecastPanel.Group>
    </>
  );

  function handleSegmentValueChange(value: string | string[]) {
    setExpandedSegmentIds(Array.isArray(value) ? value : value ? [value] : []);
  }
}
