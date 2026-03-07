# Cast Interface UI Specification

Updated on 2026-03-07.

## 1. Layout Structure

The renderer is organized around a `workbench` shell with three primary modes:

1. `show`
2. `slide-editor`
3. `overlay-editor`

Persistent shell surfaces:

1. `AppToolbar`
2. active workbench layout
3. `StatusBar`

### Show mode layout

- `LibraryPanel`
- `SlideBrowser`
- `ResourceDrawer`
- `PreviewPanel`

### Slide editor layout

- `SlideListPanel`
- `StagePanel`
- `SlideNotesPanel`
- `InspectorPanel`

### Overlay editor layout

- `OverlayListPanel`
- `StagePanel`
- `InspectorPanel`

## 2. Canonical Modes

### Workbench mode

- `show`
- `slide-editor`
- `overlay-editor`

### Slide browser mode

- `focus`
- `grid`
- `list`

### Playlist browser mode

- `current`
- `tabs`
- `continuous`

### Library panel view

- `libraries`
- `playlist`

## 3. User-Facing Vocabulary

Use ProPresenter-style nouns for product surfaces:

- `Library`
- `Playlist`
- `Continuous Playlist`
- `Preview`
- `Slide Editor`
- `Overlay Editor`
- `Media Bin`
- `Overlay Bin`

Use VS Code-style container nouns for structural terms:

- `Workbench`
- `Panel`
- `Drawer`
- `Sidebar`

## 4. Keyboard Map

Global shortcuts, disabled while typing in editable fields:

- `ArrowRight`: next slide
- `ArrowLeft`: previous slide
- `1-9`: jump to slide index
- `Enter` / `Space`: take current slide
- `Delete` / `Backspace`: delete selected element
- `Alt + 1`: `focus` slide browser mode
- `Alt + 2`: `grid` slide browser mode
- `Alt + 3`: `list` slide browser mode
- `Alt + Shift + 1`: `current` playlist browser mode
- `Alt + Shift + 2`: `tabs` playlist browser mode
- `Alt + Shift + 3`: `continuous` playlist browser mode

## 5. Interaction Rules

- Show mode focuses browsing and output preview.
- Slide editor and overlay editor keep changes local until the user pushes them.
- `StageViewport` is shared across show, slide editing, overlay editing, preview, and NDI output flows through the shared stage/rendering feature.
- `LibraryPanelView` is UI state owned by the library browser, not navigation/domain state.

## 6. Implementation Guarantees

- Library references and playlist references remain reusable.
- Media drag/drop to the stage remains intact.
- Overlay assignment remains available from the Overlay Bin.
- NDI output remains driven by the shared render scene provider.
- Persisted presentation kinds remain `canvas` or `lyrics`.
