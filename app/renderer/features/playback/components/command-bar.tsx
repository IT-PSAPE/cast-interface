import { Tab, TabBar } from '../../../components/tab-bar';
import { useUI } from '../../../contexts/ui-context';
import { OutputToggle } from '../../../components/output-toggle';
import { useNdi } from '../../../contexts/ndi-context';
import { ActionButton } from '../../../components/action-button';

interface PanelToggleButton {
  id: 'left' | 'right' | 'bottom';
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface CommandBarProps {
  panelToggles: PanelToggleButton[];
}

export function CommandBar({ panelToggles }: CommandBarProps) {
  const { workspaceView, setWorkspaceView } = useUI();
  const { outputState, toggleOutput } = useNdi();

  function handleSelectShowView() { setWorkspaceView('show'); }
  function handleSelectEditView() { setWorkspaceView('edit'); }
  function handleToggleAudience() { toggleOutput('audience'); }
  function handleToggleStage() { toggleOutput('stage'); }

  function renderPanelToggle(toggle: PanelToggleButton) {
    const stateClass = toggle.active
      ? 'border-focus text-text-primary'
      : 'border-stroke text-text-secondary';

    return (
      <ActionButton
        key={toggle.id}
        variant="ghost"
        onClick={toggle.onToggle}
        aria-pressed={toggle.active}
        title={`${toggle.active ? 'Hide' : 'Show'} ${toggle.label} panel`}
        className={stateClass}
      >
        {toggle.label}
      </ActionButton>
    );
  }

  const panelToggleNodes = panelToggles.map(renderPanelToggle);

  return (
    <header className="border-b border-stroke bg-gradient-to-b from-surface-3 to-surface-2 px-3 py-1.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Views</span>
          <TabBar label="Application views">
            <Tab active={workspaceView === 'show'} onClick={handleSelectShowView}>Show</Tab>
            <Tab active={workspaceView === 'edit'} onClick={handleSelectEditView}>Edit</Tab>
          </TabBar>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Panels</span>
            <div className="flex items-center gap-1">
              {panelToggleNodes}
            </div>
          </div>

          <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Outputs</span>
          <OutputToggle label="Audience" active={outputState.audience} onClick={handleToggleAudience} />
          <OutputToggle label="Stage" active={outputState.stage} onClick={handleToggleStage} />
          </div>
        </div>
      </div>
    </header>
  );
}
