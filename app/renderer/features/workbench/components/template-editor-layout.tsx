import { TemplateListPanel } from '../../editor/components/template-list-panel';
import { EditorLayout } from './editor-layout';

export function TemplateEditorLayout() {
  return <EditorLayout leftPanel={<TemplateListPanel />} />;
}
