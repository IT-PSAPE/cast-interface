# Cast Interface UI Code Design Spec

Updated on 2026-03-07.
Scope: `app/renderer` runtime structure after the workbench/library-browser/stage refactor.

## 1. Renderer UI Structure

```text
app/renderer
├── components
│   └── resizable-split
├── contexts
├── features
│   ├── inspector
│   ├── library-browser
│   ├── outputs
│   ├── overlay-editor
│   ├── playback
│   ├── resource-drawer
│   ├── slide-browser
│   ├── slide-editor
│   ├── stage
│   └── workbench
├── hooks
├── types
└── utils
```

Legacy namespaces `workspace`, `sidebar`, and `drawer` are no longer part of the active renderer architecture.

## 2. Provider Composition

`app/renderer/App.tsx` composes providers in this order:

1. `CastProvider`
2. `NdiProvider`
3. `NavigationProvider`
4. `PresentationLayerProvider`
5. `SlideProvider`
6. `WorkbenchProvider`
7. `SlideBrowserProvider`
8. `ResourceDrawerProvider`
9. `InspectorProvider`
10. `LibraryPanelProvider`
11. `OverlayEditorProvider`
12. `SlideEditorProvider`
13. `ElementProvider`
14. `RenderSceneProvider`

State ownership:

- `NavigationContext`: library, playlist, presentation, slide selection and CRUD.
- `WorkbenchContext`: `workbenchMode`.
- `SlideBrowserContext`: `slideBrowserMode`, `playlistBrowserMode`.
- `ResourceDrawerContext`: `drawerTab`.
- `InspectorContext`: `inspectorTab`.
- `LibraryPanelContext`: `libraryPanelView`.

## 3. Feature Ownership

### `workbench`

- App shell.
- Top toolbar.
- Split-layout orchestration and persistence.
- Show mode / slide editor / overlay editor layout composition.

### `library-browser`

- Library selector.
- Playlist tree.
- Library/playlist context menus.
- Library panel mode switching between `libraries` and `playlist`.

### `resource-drawer`

- Bottom drawer shell.
- Media Bin.
- Overlay Bin.
- Drawer search and import affordances.

### `slide-browser`

- Show-mode center surface.
- Focus/grid/list slide browsing.
- Current/tabs/continuous playlist browsing.
- Slide list/grid cards and continuous playlist presentation strips.

### `stage`

- Stage viewport.
- Stage toolbar.
- Stage panel shell.
- Scene rendering and thumbnail generation.

### `slide-editor`

- Slide list panel.
- Slide notes panel.
- Object list panel and row.
- Local slide draft workflow.

### `overlay-editor`

- Overlay list panel.
- Overlay edit drafts.
- Reuse of shared stage and object list surfaces.

### `inspector`

- Inspector panel shell.
- Presentation, slide, shape, and text inspector branches.

### `outputs`

- Live preview.
- Preview panel.
- Output toggle.
- NDI output emitter.

## 4. Shared Base Components

Shared primitives live in `app/renderer/components`.

Key primitives:

- `Button`
- `IconButton`
- `CheckboxField`
- `CheckboxSection`
- `SearchField`
- `ThumbnailTile`
- `Panel`
- `SegmentedControl`
- `SelectableRow`
- `EditableText`
- `SceneFrame`
- `TabBar`
- `LabeledField`
- `EmptyStatePanel`
- `ResizableSplitRoot`, `ResizableSplitPane`, `ResizableSplitHandle`

Feature-specific controls like `OutputToggle` intentionally live inside their owning feature when the behavior is domain-coupled.

## 5. Canonical UI Terminology

User-facing surface terms:

- `Library`
- `Playlist`
- `Continuous Playlist`
- `Slide Browser`
- `Preview`
- `Slide Editor`
- `Overlay Editor`
- `Media Bin`
- `Overlay Bin`
- `Inspector`

Internal shell/container terms:

- `Workbench`
- `Panel`
- `Sidebar`
- `Drawer`
- `Stage`

Mode/state terms from `app/renderer/types/ui.ts`:

- `workbenchMode`: `show | slide-editor | overlay-editor`
- `slideBrowserMode`: `focus | grid | list`
- `playlistBrowserMode`: `current | tabs | continuous`
- `drawerTab`: `media | overlays`
- `inspectorTab`: `presentation | slide | shape | text`
- `libraryPanelView`: `libraries | playlist`

Persisted `Presentation.kind` values remain `canvas | lyrics`; storage naming was not migrated in this pass.

## 6. Layout Summary

### Show mode

- Left: `LibraryPanel`
- Center: `SlideBrowser`
- Bottom drawer: `ResourceDrawer`
- Right: `PreviewPanel`

### Slide editor

- Left: `SlideListPanel`
- Center: `StagePanel`
- Bottom center: `SlideNotesPanel`
- Right: `InspectorPanel`

### Overlay editor

- Left: `OverlayListPanel`
- Center: `StagePanel`
- Right: `InspectorPanel`

## 7. Reference

Canonical naming and rename history live in [renderer-taxonomy.md](/Users/Craig/Developer/Projects/cast-interface/docs/renderer-taxonomy.md).
