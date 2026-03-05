# Cast Interface UI Specification (Prototype v1)

## 1. Layout Structure

Root layout uses four persistent zones with an added right utility rail:

1. `TopCommandBar`
2. `MainWorkArea`
   - `LeftHierarchyPanel`
   - `CenterWorkspace`
   - `RightOutputInspectorRail`
3. `BottomResourceDrawer`

### Component Tree

- `AppShell`
  - `TopCommandBar`
    - `ModeSegmentedControl` (`library`, `playlist`, `presentation`, `slide-editor`)
    - `PrimaryActions`
    - `PlaybackActions` (`prev`, `take`, `next`)
    - `ContextChips` (`library`, `playlist`, `presentation`, `slide`)
  - `MainWorkArea`
    - `LeftHierarchyPanel`
      - `LibraryTreeView`
        - `LibraryNode`
          - `PlaylistNode`
            - `SegmentNode`
              - `PresentationRefNode`
    - `CenterWorkspace`
      - `WorkspaceToolbar`
      - `ViewModeTabs` (`single`, `grid`, `strip`)
      - `CanvasStage` or `SlideGrid` or `SlideStrip`
    - `RightOutputInspectorRail`
      - `LivePreviewPanel`
      - `InspectorTabs` (`presentation`, `slide`, `element`)
      - `InspectorProperties`
  - `BottomResourceDrawer`
    - `ResourceTabs` (`media`, `overlays`, `shortcuts`)
    - `MediaCollection`
    - `OverlayCollection`
    - `ShortcutReference`

## 2. Interaction States

### Slide States

- `live`: currently active output slide.
- `queued`: available slide not active.
- `selected`: focused card/item in editor context.
- `warning`: slide contains no renderable elements.
- `disabled`: unavailable interaction.

### Tree States

- `expanded`
- `collapsed`
- `selected`
- `focused`

## 3. State-Color System

Use semantic tokens only. UI components may not hardcode arbitrary colors.

- `--state-live`: #2ec27e
- `--state-queued`: #3d8bfd
- `--state-selected`: #ff9f43
- `--state-warning`: #f4c84a
- `--state-disabled`: #6f7785
- `--state-error`: #eb5757

Additional surface tokens:

- `--surface-0`: #1a1b1f
- `--surface-1`: #202329
- `--surface-2`: #2a2d34
- `--surface-3`: #323640
- `--stroke-subtle`: #3d414b
- `--text-primary`: #f5f7fa
- `--text-secondary`: #b5becd

## 4. Keyboard Map

Global shortcuts (disabled while typing in inputs/textareas/contenteditable):

- `ArrowRight`: next slide
- `ArrowLeft`: previous slide
- `1-9`: jump to slide index
- `Enter` / `Space`: take current slide (manual trigger)
- `Delete` / `Backspace`: delete selected element
- `Cmd/Ctrl + 1`: library mode
- `Cmd/Ctrl + 2`: playlist mode
- `Cmd/Ctrl + 3`: presentation mode
- `Cmd/Ctrl + 4`: slide editor mode
- `Alt + 1`: single slide view
- `Alt + 2`: slide grid view
- `Alt + 3`: slide strip view

## 5. Accessibility and Focus Rules

- Tree uses `role="tree"`, nested items use `role="treeitem"`.
- Slide grid uses `role="grid"` and slide cards use `role="gridcell"`.
- All interactive controls have visible focus states.
- Color is never the only state indicator; all states include text/icon labels.

## 6. Minimum Implementation Guarantees

- Hierarchy references remain reusable (presentation references in playlists).
- Media drag/drop to canvas remains intact.
- Overlay toggles remain global to library context.
- NDI output frame updates remain tied to active slide/render updates.
