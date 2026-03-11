import type { MediaAsset } from '@core/types';
import type { ReactNode } from 'react';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { CheckboxField } from '../components/checkbox-field';
import { CheckboxSection } from '../components/checkbox-section';
import { EditableText } from '../components/editable-text';
import { EmptyStatePanel } from '../components/empty-state-panel';
import { FieldColor, FieldInput, FieldSelect } from '../components/labeled-field';
import { Icon } from '../components/icon';
import { IconButton } from '../components/icon-button';
import { MediaPickerDialog } from '../components/media-picker-dialog';
import { Panel } from '../components/panel';
import { PanelSection } from '../components/panel-section';
import { SceneFrame } from '../components/scene-frame';
import { SearchField } from '../components/search-field';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemIcon, SegmentedControlItemLabel, type SegmentedControlValue } from '../components/segmented-control';
import { SelectableRow } from '../components/selectable-row';
import { SettingsDialog } from '../components/settings-dialog';
import { Tab, TabBar } from '../components/tab-bar';
import { ThumbnailTile } from '../components/thumbnail-tile';

const EMPTY_CALLBACK = () => undefined;
const EMPTY_BOOLEAN_CALLBACK = (_next: boolean) => undefined;
const EMPTY_STRING_CALLBACK = (_next: string) => undefined;
const EMPTY_MEDIA_CONFIRM = (_assets: MediaAsset[]) => undefined;
const EMPTY_SEGMENTED_CALLBACK = (_value: SegmentedControlValue) => undefined;

const FIELD_SELECT_OPTIONS = [
  { value: 'canvas', label: 'Canvas' },
  { value: 'lyrics', label: 'Lyrics' },
];

const SAMPLE_MEDIA_ASSETS: MediaAsset[] = [
  createMediaAsset('media-1', 'Gradient Backdrop', 'image', createSvgDataUrl('#0f172a', '#2563eb', 'Backdrop')),
  createMediaAsset('media-2', 'Announcement Loop', 'animation', createSvgDataUrl('#111827', '#ec4899', 'Loop')),
];

export function UiSpecScreen() {
  return (
    <main className="min-h-screen bg-background-secondary px-6 py-6 text-text-primary">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.24em] text-text-tertiary">Cast Interface</p>
          <h1 className="m-0 text-[28px] font-semibold">Shared UI Spec Capture Surface</h1>
          <p className="m-0 max-w-[920px] text-[13px] leading-6 text-text-secondary">
            This surface renders shared primitives in labeled states for the UI code design spec screenshot pass.
          </p>
        </header>

        <SpecSection
          id="shared-actions"
          title="Shared Actions"
          description="Buttons, icon buttons, and state badges."
        >
          <SpecCard title="Button States">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button variant="take">Take</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>
          </SpecCard>

          <SpecCard title="Icon Button States">
            <div className="flex flex-wrap items-center gap-3">
              <IconButton label="Add library" onClick={EMPTY_CALLBACK}>
                <Icon.plus size={14} strokeWidth={2} />
              </IconButton>
              <IconButton label="Open menu" onClick={EMPTY_CALLBACK}>
                <Icon.dots_vertical size={14} strokeWidth={2} />
              </IconButton>
              <IconButton label="Disabled" onClick={EMPTY_CALLBACK} disabled>
                <Icon.x_close size={14} strokeWidth={2} />
              </IconButton>
            </div>
          </SpecCard>

          <SpecCard title="Badge States">
            <div className="flex flex-wrap items-center gap-3">
              <Badge state="live" label="Live" />
              <Badge state="queued" label="Queued" />
              <Badge state="selected" marker="2" label="Selected" />
              <Badge state="warning" label="Empty" />
            </div>
          </SpecCard>
        </SpecSection>

        <SpecSection
          id="shared-fields"
          title="Shared Fields"
          description="Search, checkbox, and labeled form-field primitives."
        >
          <SpecCard title="Search and Checkbox">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <SearchField value="welcome" onChange={EMPTY_STRING_CALLBACK} placeholder="Filter" />
                <CheckboxField checked label="Audience output enabled" onChange={EMPTY_BOOLEAN_CALLBACK} />
                <CheckboxField checked={false} label="Overlay visible" onChange={EMPTY_BOOLEAN_CALLBACK} />
              </div>

              <div className="grid gap-3">
                <CheckboxSection label="Apply media layer" enabled onToggle={EMPTY_BOOLEAN_CALLBACK}>
                  <SearchField value="gradient" onChange={EMPTY_STRING_CALLBACK} placeholder="Search assets" />
                </CheckboxSection>
                <CheckboxSection label="Apply overlay layer" enabled={false} onToggle={EMPTY_BOOLEAN_CALLBACK}>
                  <Button variant="ghost">Unused</Button>
                </CheckboxSection>
              </div>
            </div>
          </SpecCard>

          <SpecCard title="Field Inputs">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FieldInput value="Welcome to Cast Interface" onChange={EMPTY_STRING_CALLBACK} />
              <FieldInput type="number" value={1920} onChange={EMPTY_STRING_CALLBACK} min={0} />
              <FieldSelect value="canvas" onChange={EMPTY_STRING_CALLBACK} options={FIELD_SELECT_OPTIONS} />
              <FieldColor value="#FF1493" onChange={EMPTY_STRING_CALLBACK} />
              <FieldColor value="#00000099" onChange={EMPTY_STRING_CALLBACK} />
            </div>
          </SpecCard>
        </SpecSection>

        <SpecSection
          id="shared-navigation"
          title="Shared Navigation"
          description="Segmented controls, tab bars, and selectable rows."
        >
          <SpecCard title="Segmented Controls">
            <div className="flex flex-col gap-4">
              <SegmentedControl label="Application views" selectionMode="single" value="slide-editor" onValueChange={EMPTY_SEGMENTED_CALLBACK}>
                <SegmentedControlItem value="show" title="Show mode" variant="label">
                  <SegmentedControlItemLabel>Show</SegmentedControlItemLabel>
                </SegmentedControlItem>
                <SegmentedControlItem value="slide-editor" title="Slide editor" variant="label">
                  <SegmentedControlItemLabel>Edit</SegmentedControlItemLabel>
                </SegmentedControlItem>
                <SegmentedControlItem value="overlay-editor" title="Overlay editor" variant="label">
                  <SegmentedControlItemLabel>Overlay</SegmentedControlItemLabel>
                </SegmentedControlItem>
              </SegmentedControl>

              <SegmentedControl label="Panel visibility" selectionMode="multiple" value={['left', 'right']} onValueChange={EMPTY_SEGMENTED_CALLBACK}>
                <SegmentedControlItem value="left" title="Left panel" variant="icon">
                  <SegmentedControlItemIcon>
                    <Icon.layout_left size={14} strokeWidth={1.5} />
                  </SegmentedControlItemIcon>
                </SegmentedControlItem>
                <SegmentedControlItem value="bottom" title="Bottom panel" variant="icon">
                  <SegmentedControlItemIcon>
                    <Icon.layout_bottom size={14} strokeWidth={1.5} />
                  </SegmentedControlItemIcon>
                </SegmentedControlItem>
                <SegmentedControlItem value="right" title="Right panel" variant="icon">
                  <SegmentedControlItemIcon>
                    <Icon.layout_right size={14} strokeWidth={1.5} />
                  </SegmentedControlItemIcon>
                </SegmentedControlItem>
              </SegmentedControl>
            </div>
          </SpecCard>

          <SpecCard title="Tab Bars and Rows">
            <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
              <div className="grid gap-2">
                <TabBar label="Resource tabs">
                  <Tab active onClick={EMPTY_CALLBACK}>Media</Tab>
                  <Tab active={false} onClick={EMPTY_CALLBACK}>Overlays</Tab>
                  <Tab active={false} onClick={EMPTY_CALLBACK}>Presentations</Tab>
                </TabBar>
                <TabBar label="Inspector">
                  <Tab active={false} onClick={EMPTY_CALLBACK}>Presentation</Tab>
                  <Tab active onClick={EMPTY_CALLBACK}>Slide</Tab>
                  <Tab active={false} onClick={EMPTY_CALLBACK}>Shape</Tab>
                  <Tab active={false} onClick={EMPTY_CALLBACK}>Text</Tab>
                </TabBar>
              </div>

              <div className="grid gap-2">
                <SelectableRow
                  selected={false}
                  onClick={EMPTY_CALLBACK}
                  leading={<span className="text-[11px] font-bold text-text-tertiary">T</span>}
                  title="Welcome to Cast Interface"
                  trailing={<span className="text-[11px] text-text-tertiary">Visible</span>}
                />
                <SelectableRow
                  selected
                  onClick={EMPTY_CALLBACK}
                  leading={<span className="text-[11px] font-bold text-text-tertiary">#</span>}
                  title="Background Shape"
                  trailing={<span className="text-[11px] text-text-tertiary">Locked</span>}
                />
              </div>
            </div>
          </SpecCard>
        </SpecSection>

        <SpecSection
          id="shared-display"
          title="Shared Display"
          description="Panels, tiles, scene framing, and editable text states."
        >
          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <SpecCard title="Panel and Panel Section">
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Preview Panel" action={<Button variant="ghost">Action</Button>}>
                  <p className="m-0 text-[12px] text-text-secondary">Media is rendered below content, with overlay on top.</p>
                </Panel>

                <div className="rounded-md border border-border-primary bg-primary">
                  <PanelSection
                    title={<span className="text-[12px] font-medium text-text-primary">Presentation slides</span>}
                    action={<Button className="grid h-6 w-6 place-items-center p-0"><Icon.plus size={14} strokeWidth={2} /></Button>}
                    headerClassName="border-b border-border-primary"
                    bodyClassName="p-2"
                  >
                    <div className="grid gap-2">
                      <span className="text-[12px] text-text-secondary">Section body content</span>
                      <span className="text-[11px] text-text-tertiary">Reusable shell for feature panels.</span>
                    </div>
                  </PanelSection>
                </div>
              </div>
            </SpecCard>

            <SpecCard title="Editable Text States">
              <div className="grid gap-3">
                <div className="rounded-md border border-border-primary bg-background-primary px-3 py-2">
                  <EditableText value="Sunday Service" onCommit={EMPTY_STRING_CALLBACK} className="text-[13px] font-medium text-text-primary" />
                </div>
                <div className="rounded-md border border-border-primary bg-background-primary px-3 py-2">
                  <EditableText value="Welcome Slides" onCommit={EMPTY_STRING_CALLBACK} editing className="text-[13px] font-medium text-text-primary" />
                </div>
              </div>
            </SpecCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <SpecCard title="Thumbnail Tiles and Scene Frames">
              <div className="grid gap-4 lg:grid-cols-2">
                <ThumbnailTile
                  onClick={EMPTY_CALLBACK}
                  body={<StagePlaceholder checkerboard={false} />}
                  caption={<span>Default slide thumbnail</span>}
                />
                <ThumbnailTile
                  onClick={EMPTY_CALLBACK}
                  selected
                  body={<StagePlaceholder checkerboard />}
                  caption={<span>Selected overlay thumbnail</span>}
                />
              </div>
            </SpecCard>

            <SpecCard title="Empty State">
              <div className="min-h-[280px] rounded-md border border-border-primary bg-primary">
                <EmptyStatePanel
                  glyph={<span className="text-[26px] text-text-tertiary">∅</span>}
                  title="No presentation selected"
                  description="Select a presentation from a playlist or from the presentations drawer."
                />
              </div>
            </SpecCard>
          </div>
        </SpecSection>

        <SpecSection
          id="shared-dialogs"
          title="Shared Dialogs"
          description="Current modal surfaces reused across the renderer."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <SpecCard title="Settings Dialog">
              <div className="relative min-h-[320px] overflow-hidden rounded-md border border-border-primary bg-background-secondary">
                <SettingsDialog onClose={EMPTY_CALLBACK} />
              </div>
            </SpecCard>

            <SpecCard title="Media Picker Dialog">
              <div className="relative min-h-[420px] overflow-hidden rounded-md border border-border-primary bg-background-secondary">
                <MediaPickerDialog assets={SAMPLE_MEDIA_ASSETS} onConfirm={EMPTY_MEDIA_CONFIRM} onClose={EMPTY_CALLBACK} />
              </div>
            </SpecCard>
          </div>
        </SpecSection>
      </div>
    </main>
  );
}

interface SpecSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

function SpecSection({ id, title, description, children }: SpecSectionProps) {
  return (
    <section data-ui-spec={id} className="rounded-2xl border border-border-primary bg-primary/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="m-0 text-[18px] font-semibold">{title}</h2>
        <p className="m-0 text-[12px] leading-5 text-text-tertiary">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

interface SpecCardProps {
  title: string;
  children: ReactNode;
}

function SpecCard({ title, children }: SpecCardProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border-primary bg-background-primary/65 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">{title}</div>
      {children}
    </div>
  );
}

function StagePlaceholder({ checkerboard }: { checkerboard: boolean }) {
  return (
    <SceneFrame width={1920} height={1080} checkerboard={checkerboard} className="bg-background-tertiary">
      <div className="absolute inset-[14%_10%] rounded-xl border border-white/20 bg-gradient-to-br from-brand-400/35 to-transparent" />
      <div className="absolute left-[16%] top-[24%] h-[16%] w-[58%] rounded-md bg-white/14" />
      <div className="absolute left-[16%] top-[48%] h-[10%] w-[46%] rounded-md bg-white/10" />
    </SceneFrame>
  );
}

function createMediaAsset(id: string, name: string, type: MediaAsset['type'], src: string): MediaAsset {
  return {
    id,
    name,
    type,
    src,
    createdAt: '2026-03-08T00:00:00.000Z',
    updatedAt: '2026-03-08T00:00:00.000Z',
  };
}

function createSvgDataUrl(background: string, accent: string, label: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#g)" rx="18" />
      <circle cx="70" cy="72" r="46" fill="rgba(255,255,255,0.14)" />
      <rect x="122" y="58" width="124" height="20" rx="10" fill="rgba(255,255,255,0.22)" />
      <rect x="122" y="90" width="82" height="14" rx="7" fill="rgba(255,255,255,0.14)" />
      <text x="24" y="152" fill="white" font-size="18" font-family="Avenir Next, Helvetica, Arial" font-weight="700">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
