import { ChevronLeft } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SectionHeader } from '../../components/display/section-header';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';
import { PanelRoute } from '../workbench/panel-route';
import { useLibraryPanelState } from './library-panel-context';
import { PlaylistList } from './playlist-list';
import { SegmentsBrowser } from './segments-browser';

export function PlaylistBrowser() {
  const { currentLibraryBundle } = useNavigation();
  const { libraryPanelView } = useLibraryPanelState();
  const { actions } = useLibraryBrowser();

  function handleBack() {
    actions.setLibrariesView();
  }

  if (libraryPanelView !== 'playlist') return null;
  if (!currentLibraryBundle) return null;

  return (
    <>
      <SectionHeader.Root>
        <SectionHeader.Leading>
          <Button.Icon label="Back to libraries" onClick={handleBack} variant="ghost">
            <ChevronLeft/>
          </Button.Icon>
        </SectionHeader.Leading>
        <SectionHeader.Body>
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">{currentLibraryBundle.library.name}</span>
        </SectionHeader.Body>
      </SectionHeader.Root>
      <PanelRoute.Split splitId="library-panel" orientation="vertical" className="flex-1">
        <PanelRoute.Panel id="library-playlists" defaultSize={200} minSize={120}>
          <PlaylistList />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="library-segments" defaultSize={320} minSize={180}>
          <SegmentsBrowser />
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </>
  );
}
