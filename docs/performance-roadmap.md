# Performance Roadmap

Updated on 2026-04-29.

## Goals

Improve three resource classes without destabilizing live-output behavior:

1. CPU time
2. memory footprint
3. GPU / video decode / canvas readback cost

This roadmap is ordered by impact and implementation risk, not by subsystem ownership.

## Phase 0: Measurement Baseline

Before larger refactors, add instrumentation so regressions and wins are measurable.

Targets:

- NDI capture timing and dropped-frame counts
- `SceneStage` mount counts by workbench mode
- visible thumbnail count vs mounted thumbnail count
- video resource count per `src`
- undo/redo heap estimate based on snapshot size

Acceptance criteria:

- We can answer “what is consuming CPU/memory/GPU right now?” from app diagnostics instead of inference alone.
- We can compare pre/post numbers for every later phase.

Primary files:

- `app/renderer/features/playback/ndi-frame-capture.tsx`
- `app/main/ndi/ndi-service.ts`
- `app/renderer/contexts/canvas/canvas-context.tsx`
- `app/renderer/contexts/app-context.tsx`

## Phase 1: Renderer Scene Cost

Reduce unnecessary scene creation and thumbnail rendering churn in the renderer.

Work items:

- Lazy-mount every remaining thumbnail/grid `SceneStage`
- Cache `buildRenderScene(...)` results for templates, overlays, and stages
- Keep expensive preview surfaces mounted only when visible/needed
- Audit show-mode multi-surface rendering so “all previews” does not silently become the default heavy path

Acceptance criteria:

- Browsing large slide/template/overlay/stage collections mounts fewer live Konva stages.
- Scroll performance improves in bins and slide browsers.
- Idle GPU usage drops when resource drawers are open.

Primary files:

- `app/renderer/features/deck/slide-grid-tile.tsx`
- `app/renderer/features/assets/templates/template-bin-panel.tsx`
- `app/renderer/features/assets/overlays/overlay-bin-panel.tsx`
- `app/renderer/features/assets/stages/stage-bin-panel.tsx`
- `app/renderer/screens/template-editor/page.tsx`
- `app/renderer/components/display/lazy-scene-stage.tsx`

## Phase 2: NDI Transport and Readback

The current NDI path is the largest confirmed CPU/memory hotspot.

Work items:

- Add backpressure and explicit frame dropping instead of copying every eligible frame
- Avoid repeated `getImageData()` where possible
- Reduce renderer-to-main copies
- Revisit whether one authoritative raster can feed both monitor and NDI instead of duplicating render/capture work

Acceptance criteria:

- Lower frame-copy bandwidth per output
- Stable behavior when outputs are enabled on slower machines
- No runaway memory growth during sustained live output

Primary files:

- `app/renderer/features/playback/ndi-frame-capture.tsx`
- `app/main/ipc.ts`
- `app/main/ndi/ndi-service.ts`
- `packages/ndi-native/src/ndi_native.cc`

## Phase 3: Video Resource Pooling

The app should not decode the same media repeatedly across preview surfaces and hidden outputs.

Work items:

- Pool `HTMLVideoElement` resources by `src`
- Separate “decode owner” from “display consumer”
- Cap concurrent autoplay/active video resources for thumbnail contexts
- Decide when thumbnails should use poster frames instead of live video playback

Acceptance criteria:

- Duplicate preview/output surfaces do not multiply video decode cost linearly.
- Video-heavy decks use less RAM and GPU video engine time.

Primary files:

- `app/renderer/features/canvas/use-k-video.ts`
- `app/renderer/features/canvas/scene-node-media.tsx`
- `app/renderer/features/playback/preview-panel.tsx`
- `app/renderer/features/playback/ndi-frame-capture.tsx`

## Phase 4: History / Memory Footprint

Undo/redo currently stores full snapshots and will scale poorly with project size.

Work items:

- Replace full-snapshot history with patch/diff history, or structural-sharing snapshots
- Bound history memory by estimated size, not only entry count
- Keep media-heavy state out of repeated history payloads where possible

Acceptance criteria:

- Memory growth remains bounded during long edit sessions.
- Large projects do not make undo/redo disproportionately expensive.

Primary files:

- `app/renderer/contexts/app-context.tsx`
- `app/core/snapshot-patch.ts`
- `app/database/store.ts`

## Phase 5: Text and Canvas Hot Paths

Text rendering does extra work in the draw path today.

Work items:

- Remove per-draw offscreen canvas allocation for inside-stroke text
- Cache text raster/layout artifacts for stable payloads
- Audit repeated `ResizeObserver`/layout recomputation around scene frames

Acceptance criteria:

- Dense text scenes consume less CPU during editing and preview.
- Frequent redraws do not allocate new offscreen canvases per frame.

Primary files:

- `app/renderer/features/canvas/scene-node-text.tsx`
- `app/renderer/components/display/scene-frame.tsx`
- `app/renderer/features/canvas/text-layout.ts`

## Phase 6: Show-Mode Surface Policy

The app can currently mount multiple full renderers plus hidden NDI outputs at once.

Work items:

- Revisit default show-mode preview density
- Add surface throttling/degradation rules for hidden or background surfaces
- Consider “static preview until interacted with” behavior for non-primary surfaces

Acceptance criteria:

- Show mode remains responsive even with outputs enabled.
- Multi-surface layouts no longer scale renderer cost linearly without limits.

Primary files:

- `app/renderer/features/playback/preview-panel.tsx`
- `app/renderer/screens/show/page.tsx`
- `app/renderer/features/playback/ndi-outputs.tsx`

## Execution Order

1. Phase 1
2. Phase 0 instrumentation if missing for the next tranche
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6

## Current Status

- Phase 1 is the active implementation tranche.
- Phases 2–6 are planned but not yet implemented.
