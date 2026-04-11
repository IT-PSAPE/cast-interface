import { OverlayListPanel } from '../editor/overlay-list-panel';
import { EditorLayout } from './editor-layout';

export function OverlayEditorLayout() {
  return <EditorLayout leftPanel={<OverlayListPanel />} />;
}
