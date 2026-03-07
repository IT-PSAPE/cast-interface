# Renderer Taxonomy

Updated on 2026-03-07.

This document is the canonical naming and boundary reference for the renderer.

## 1. Canonical Terms

Internal shell terms:

- `workbench`
- `panel`
- `drawer`
- `sidebar`
- `stage`

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

## 2. Rename Matrix

| Previous name | Canonical name |
|---|---|
| `WorkspaceView` / `WorkspaceMode` | `WorkbenchMode` |
| `CanvasViewMode` | `SlideBrowserMode` |
| `PlaylistDisplayMode` | `PlaylistBrowserMode` |
| `SidebarStage` | `LibraryPanelView` |
| `ActionButton` | `Button` |
| `ToggleSection` | `CheckboxSection` |
| `CommandBar` | `AppToolbar` |
| `Sidebar` | `LibraryPanel` |
| `ShowPreviewRail` | `PreviewPanel` |
| `InspectorRail` | `InspectorPanel` |
| `Workspace` | `SlideBrowser` |
| `WorkspaceToolbar` | `SlideBrowserToolbar` |
| `CanvasStage` | `StageViewport` |
| `CanvasToolbar` | `StageToolbar` |
| `EditCanvasPanel` | `StagePanel` |
| `EditSlideListPanel` | `SlideListPanel` |
| `EditSlideNotesPanel` | `SlideNotesPanel` |
| `EditOverlayListPanel` | `OverlayListPanel` |
| `EditObjectListPanel` | `ObjectListPanel` |
| `EditObjectRow` | `ObjectListRow` |
| `ShowViewLayout` | `ShowModeLayout` |
| `EditViewLayout` | `SlideEditorLayout` |
| `OverlayViewLayout` | `OverlayEditorLayout` |

## 3. Feature Boundaries

| Feature | Owns |
|---|---|
| `workbench` | App shell, toolbar, mode switching, split layouts, panel visibility |
| `library-browser` | Library tree, playlist tree, library panel view state |
| `resource-drawer` | Media Bin, Overlay Bin, drawer tab state |
| `slide-browser` | Focus/grid/list browsing, current/tabs/continuous playlist browsing |
| `stage` | Stage viewport, stage toolbar, render scene provider, shared thumbnails |
| `slide-editor` | Slide drafts, notes, object list, slide editing composition |
| `overlay-editor` | Overlay drafts, overlay list, overlay editing composition |
| `inspector` | Presentation/slide/element inspectors |
| `outputs` | Preview, output toggles, NDI emitter |

## 4. Context Ownership

| Context | Responsibility |
|---|---|
| `NavigationContext` | Selection and CRUD for library, playlist, presentation, slide |
| `WorkbenchContext` | Current workbench mode |
| `SlideBrowserContext` | Slide browser and playlist browser modes |
| `ResourceDrawerContext` | Active drawer tab |
| `InspectorContext` | Active inspector tab |
| `LibraryPanelContext` | Library panel surface selection |

## 5. Explicit Non-Goals

- Database and IPC payloads were not renamed unless required by the renderer.
- Persisted `Presentation.kind = 'canvas'` remains unchanged in storage.
- `OutputToggle` remains feature-owned in `outputs` because it is not a generic primitive.
