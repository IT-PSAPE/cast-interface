import { ChevronLeft } from 'lucide-react';
import { useNavigation } from '@renderer/contexts/navigation-context';
import { ReacstButton } from '@renderer/components 2.0/button';
import { Label } from '@renderer/components/display/text';
import { ContextMenu } from '@renderer/components/overlays/context-menu';
import { SplitPanel } from '@renderer/features/workbench/split-panel';
import { useLibraryBrowser } from './library-browser-context';
import { PlaylistList } from './playlist-list';
import { SegmentsBrowser } from './segments-browser';
import { RecastPanel } from '@renderer/components 2.0/panel';

export function PlaylistPanels() {
  const { currentLibraryBundle } = useNavigation();
  const { state: libraryBrowserState, actions } = useLibraryBrowser();

  if (!currentLibraryBundle) return null;

  function handleMenuOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    actions.closeMenu();
  }

  return (
    <RecastPanel.Root className='h-full'>
      <RecastPanel.Group>
        <RecastPanel.GroupTitle>
          <ReacstButton.Icon label="Back to libraries" onClick={actions.setLibrariesView}>
            <ChevronLeft />
          </ReacstButton.Icon>
          <Label.sm className="mr-auto">{currentLibraryBundle.library.name}</Label.sm>
        </RecastPanel.GroupTitle>

        <SplitPanel.Panel splitId="library-panel" orientation="vertical" className="flex-1">
          <SplitPanel.Segment id="library-playlists" defaultSize={200} minSize={120}>
            <PlaylistList />
          </SplitPanel.Segment>
          <SplitPanel.Segment id="library-segments" defaultSize={320} minSize={180}>
            <SegmentsBrowser />
          </SplitPanel.Segment>
        </SplitPanel.Panel>

        <ContextMenu.Root open={Boolean(libraryBrowserState.menuState)} position={libraryBrowserState.menuState} onOpenChange={handleMenuOpenChange}>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                <ContextMenu.Items items={libraryBrowserState.menuItems} />
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </RecastPanel.Group>
    </RecastPanel.Root>
  );
}
