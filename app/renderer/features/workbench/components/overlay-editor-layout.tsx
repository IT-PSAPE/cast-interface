import { OverlayListPanel } from '../../editor/components/overlay-list-panel';
import { EditorLayout } from './editor-layout';

export function OverlayEditorLayout() {
  return <EditorLayout leftPanel={<OverlayListPanel />} />;
}
