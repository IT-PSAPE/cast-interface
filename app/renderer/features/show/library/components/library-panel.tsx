import { ContextMenu } from '../../../../components/overlays/context-menu';
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
    <aside
      data-ui-region="library-panel"
      className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border-primary bg-primary"
    >
      <LibraryBrowser />
      <PlaylistBrowser />

      {state.menuState ? <ContextMenu x={state.menuState.x} y={state.menuState.y} items={state.menuItems} onClose={actions.closeMenu} /> : null}
    </aside>
  );
}
