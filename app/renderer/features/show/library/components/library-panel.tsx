import { ContextMenu } from '../../../../components/overlays/context-menu';
import { Panel } from '../../../../components/panel';
import { LibraryBrowserProvider, useLibraryBrowser } from '../contexts/library-browser-context';
import { LibraryBrowser } from './library-browser';
import { PlaylistBrowser } from './playlist-browser';

export function LibraryPanel() {
  return (
    <LibraryBrowserProvider>
      <LibraryPanelLayout />
    </LibraryBrowserProvider>
  );
}

function LibraryPanelLayout() {
  const { state, actions } = useLibraryBrowser();

  return (
    <Panel.Root as="aside" bordered="right" data-ui-region="library-panel">
      <LibraryBrowser />
      <PlaylistBrowser />

      {state.menuState ? <ContextMenu x={state.menuState.x} y={state.menuState.y} items={state.menuItems} onClose={actions.closeMenu} /> : null}
    </Panel.Root>
  );
}
