import { useWorkbench } from './contexts/workbench-context';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { DeckEditorScreen } from './screens/deck-editor/page';
import { OverlayEditorScreen } from './screens/overlay-editor/page';
import { SettingsScreen } from './screens/settings/page';
import { ShowScreen } from './screens/show/page';
import { TemplateEditorScreen } from './screens/template-editor/page';

export function WorkbenchScreenRouter() {
  const { state: { workbenchMode } } = useWorkbench();

  useKeyboardShortcuts();

  if (workbenchMode === 'show') {
    return <ShowScreen />;
  }

  if (workbenchMode === 'deck-editor') {
    return <DeckEditorScreen />;
  }

  if (workbenchMode === 'overlay-editor') {
    return <OverlayEditorScreen />;
  }

  if (workbenchMode === 'template-editor') {
    return <TemplateEditorScreen />;
  }

  return <SettingsScreen />;
}
