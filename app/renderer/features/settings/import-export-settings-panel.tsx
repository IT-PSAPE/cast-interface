import { Button } from '../../components/controls/button';
import { SearchField } from '../../components/form/search-field';
import { SettingsSection } from './settings-section';
import { BrokenReferenceReviewList } from './broken-reference-review-list';
import { ContentBundleSelectionList } from './content-bundle-selection-list';
import { useImportExportSettings } from './use-import-export-settings';

function renderSummaryLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ImportExportSettingsPanel() {
  const { actions, state } = useImportExportSettings();
  const inspection = state.inspection;
  const hasSelection = state.selectedCount > 0;
  const hasInspection = inspection !== null;
  const canFinalizeImport = hasInspection && state.blockedImportReasons.length === 0 && !state.importInFlight;

  function handleExportClick() {
    void actions.exportSelected();
  }

  function handleImportChooseClick() {
    void actions.chooseImportBundle();
  }

  function handleImportClearClick() {
    actions.clearImportReview();
  }

  function handleImportFinalizeClick() {
    void actions.finalizeImport();
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Export Content"
        action={(
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={actions.selectAllVisible} disabled={state.contentItems.length === 0}>Select Visible</Button>
            <Button variant="ghost" onClick={actions.clearSelection} disabled={!hasSelection}>Clear</Button>
            <Button onClick={handleExportClick} disabled={!hasSelection || state.exportInFlight}>
              {state.exportInFlight ? 'Exporting...' : `Export Selected${hasSelection ? ` (${state.selectedCount})` : ''}`}
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-3">
          <SearchField value={state.filterText} onChange={actions.setFilterText} placeholder="Search decks and lyrics" className="max-w-sm" />
          <ContentBundleSelectionList items={state.contentItems} selectedIds={state.selectedIds} onToggle={actions.toggleSelectedId} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Import Bundle"
        action={(
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleImportClearClick} disabled={!hasInspection && !state.importPath}>Clear</Button>
            <Button variant="ghost" onClick={handleImportChooseClick} disabled={state.importInFlight}>
              {state.importInFlight && !hasInspection ? 'Loading...' : 'Choose Bundle'}
            </Button>
            <Button onClick={handleImportFinalizeClick} disabled={!canFinalizeImport}>
              {state.importInFlight && hasInspection ? 'Importing...' : 'Import'}
            </Button>
          </div>
        )}
      >
        {!hasInspection ? (
          <div className="rounded border border-primary bg-tertiary/30 px-3 py-4 text-sm text-tertiary">
            Choose a `.cst` file to inspect its items, templates, and media references before importing.
          </div>
        ) : (
          renderInspectionContent({
            importPath: state.importPath,
            inspection,
            decisionMap: state.decisionMap,
            blockedImportReasons: state.blockedImportReasons,
            onActionChange: actions.setBrokenReferenceAction,
            onChooseReplacement: actions.chooseReplacementPath,
          })
        )}
      </SettingsSection>

      {state.message ? (
        <div className="rounded border border-primary bg-tertiary/25 px-3 py-2 text-sm text-secondary">
          {state.message}
        </div>
      ) : null}
    </div>
  );
}

function renderInspectionContent({
  importPath,
  inspection,
  decisionMap,
  blockedImportReasons,
  onActionChange,
  onChooseReplacement,
}: {
  importPath: string | null;
  inspection: NonNullable<ReturnType<typeof useImportExportSettings>['state']['inspection']>;
  decisionMap: ReadonlyMap<string, { action: 'replace' | 'remove' | 'leave'; replacementPath: string | null }>;
  blockedImportReasons: string[];
  onActionChange: (source: string, action: 'replace' | 'remove' | 'leave') => void;
  onChooseReplacement: (source: string) => Promise<void>;
}) {
  const inspectionItemRows = inspection.items.map(renderInspectionItemRow);
  const blockedReasonRows = blockedImportReasons.map(renderBlockedReasonRow);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded border border-primary bg-tertiary/25 p-3">
        <div className="text-sm font-medium text-primary">{importPath}</div>
        <div className="text-xs text-tertiary">
          {renderSummaryLabel(inspection.itemCount, 'item', 'items')}, {renderSummaryLabel(inspection.templateCount, 'template', 'templates')}, {renderSummaryLabel(inspection.mediaReferenceCount, 'media reference', 'media references')}
        </div>
      </div>

      {inspection.items.length > 0 ? (
        <div className="flex flex-col gap-1 rounded border border-primary bg-tertiary/25 p-3">{inspectionItemRows}</div>
      ) : null}

      {inspection.brokenReferences.length > 0 ? (
        <BrokenReferenceReviewList
          inspection={inspection}
          decisionMap={decisionMap}
          onActionChange={onActionChange}
          onChooseReplacement={onChooseReplacement}
        />
      ) : (
        <div className="rounded border border-primary bg-tertiary/30 px-3 py-4 text-sm text-tertiary">
          No broken local media references were found in this bundle.
        </div>
      )}

      {blockedImportReasons.length > 0 ? (
        <div className="flex flex-col gap-1 rounded border border-primary bg-tertiary/25 p-3 text-xs text-tertiary">{blockedReasonRows}</div>
      ) : null}
    </div>
  );
}

function renderInspectionItemRow(item: { id: string; title: string; type: string; slideCount: number }) {
  return (
    <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-secondary">
      <span className="truncate text-primary">{item.title}</span>
      <span className="shrink-0 text-xs uppercase tracking-wide text-tertiary">
        {item.type} · {item.slideCount} slide{item.slideCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function renderBlockedReasonRow(reason: string) {
  return <div key={reason}>{reason}</div>;
}
