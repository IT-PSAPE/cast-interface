# Cast Interface Prototype

Minimal cross-platform Electron prototype for a ProPresenter-style presentation workflow focused on:

- reusable content hierarchy
- slide rendering engine
- NDI output path driven by an offscreen renderer window

## Stack

- Electron + TypeScript
- React
- React-Konva unified rendering engine (dedicated 1920x1080 output scene)
- Node.js
- SQLite (`better-sqlite3`)

## Run

```bash
npm install
npm run build:ndi-native
npm run dev
```

Build:

```bash
npm run build
```

## Architecture

- `app/main/` Electron main process, IPC, and NDI adapter boundary.
- `app/renderer/` React app organized around a `workbench` shell plus feature-owned library-browser, resource-drawer, slide-browser, stage, editor, inspector, and output surfaces.
- `app/renderer/features/stage/rendering/` unified scene builder + Konva stage rendering for editor, thumbnails, preview, and output.
- `app/database/` SQLite schema, seed data, and repository operations.
- `app/core/` shared domain types and IPC contracts.

## Implemented Prototype Capabilities

- Create multiple libraries.
- Create presentations and slides.
- Add text, shape, image, and video slide elements.
- Drag media assets from bottom panel onto slide canvas.
- Build playlists with segments and add presentations by reference.
- Reuse one presentation across multiple playlist entries.
- Edit slide elements on canvas (move and resize).
- Multi-select, marquee selection, rotate/resize transformer, snap guides, keyboard nudge.
- Clipboard and history in edit mode (`copy`, `paste`, `undo`, `redo`).
- Toggle overlays independent of slides.
- Render layered output with z-index, rotation, opacity, text/media rendering.
- Dedicated 1920x1080 output canvas.
- Keyboard playback controls: right/left arrow and number keys.
- Real-time offscreen-rendered NDI output with main-process sender control.

## NDI Integration

The app includes a concrete native Node-API bridge package:

- `packages/ndi-native` (`@cast-interface/ndi-native`)

The Electron main process integration lives in `app/main/ndi/ndi-service.ts`.
Runtime behavior reference lives in `docs/ndi-runtime-reference.md`.

If the addon is missing or the NDI runtime library cannot be found, the app falls back to no-op mode and logs a warning.

Native module API:

- `initializeSender({ senderName, width, height, withAlpha })`
- `sendBgraFrame(senderName, buffer, width, height, stride)`
- `getSenderConnections(senderName, timeoutMs?)`
- `destroySender(senderName?)`

The sender is initialized with:

- sender name: `Cast Interface - Audience`
- resolution: `1920x1080`
- alpha enabled: `true`

Main process NDI behavior:

- The visible renderer publishes one authoritative `ProgramOutputScene` to the main process.
- A dedicated hidden offscreen renderer window consumes that program scene and produces paint bitmaps for NDI.
- Paint dispatch is bounded with a latest-frame-wins queue to prevent unbounded memory growth.
- The visible program preview and the hidden offscreen output render the same scene contract.
- If paint frames stop arriving, the main process re-sends the last paint or an empty frame that matches the current alpha mode at `30 FPS`.
- The offscreen renderer window is recreated automatically after crash/load failure and replays the latest program scene.
- Output raster is fixed at `1920x1080`; only sender name and alpha are operator-configurable.
- Graceful shutdown (`before-quit`, `will-quit`, process exit/signals) tears down all NDI senders and runtime.

### NDI runtime discovery

The native addon dynamically loads the NDI runtime at execution time (no static SDK link required).

Environment overrides:

- `CAST_NDI_RUNTIME_PATH`: absolute path to the NDI dynamic library file.
- `NDI_RUNTIME_DIR`: directory that contains the NDI runtime library.

Default library names:

- macOS: `libndi.dylib`
- Windows: `Processing.NDI.Lib.x64.dll`
- Linux: `libndi.so.6` / `libndi.so`

Default macOS candidate paths also include common NDI Tools bundle locations:

- `/Applications/NDI Video Monitor.app/Contents/Frameworks/libndi.dylib`
- `/Applications/NDI Video Monitor.app/Contents/Frameworks/libndi_advanced.dylib`
- `/Applications/NDI Discovery.app/Contents/Frameworks/libndi_advanced.dylib`
- `/Applications/NDI Scan Converter.app/Contents/Frameworks/libndi.dylib`
- `/Applications/NDI Virtual Input.app/Contents/Frameworks/libndi_advanced.dylib`
- `/Applications/NDI Router.app/Contents/Frameworks/NTFramework.framework/Versions/Current/Frameworks/libndi.dylib`

### Runtime install notes

- macOS: install NDI Tools or NDI Runtime, then ensure `libndi.dylib` is present.
- Windows: install NDI Runtime and confirm `Processing.NDI.Lib.x64.dll` is in PATH or set `CAST_NDI_RUNTIME_PATH`.
- If auto-discovery fails, explicitly set:
  - `CAST_NDI_RUNTIME_PATH=/absolute/path/to/libndi.dylib` (macOS/Linux)
  - `CAST_NDI_RUNTIME_PATH=C:\\path\\to\\Processing.NDI.Lib.x64.dll` (Windows)

## Notes

- Persistence database is stored in Electron user data path as `cast-interface.sqlite`.
- The repository seeds an initial library/presentation/playlist/overlay for first launch.
- Prototype intentionally excludes cloud/network automation features.
