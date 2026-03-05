# NDI Stability Notes

## Primary-source findings

- NDI senders can serve multiple receivers at once; sender-side logic should not assume a single receiver.
- SDK guidance distinguishes asynchronous send paths and explicit clocking behavior, which impacts whether sender calls can block.
- Video frame formats and FourCC handling require explicit pixel format control (`BGRA`/`BGRX`) and valid stride/dimension alignment.
- Receiver failover is an SDK-level capability for source loss events; abrupt process termination can still bypass graceful app teardown.

Sources:

- [NDI SEND (official docs)](https://docs.ndi.video/all/developing-with-ndi/sdk/ndi-send)
- [NDI Frame Types (official docs)](https://docs.ndi.video/all/developing-with-ndi/sdk/frame-types)
- [NDI Performance and Implementation (official docs)](https://docs.ndi.video/all/developing-with-ndi/sdk/performance-and-implementation)
- [NDI Receiver Failsafe / Failover (official docs)](https://docs.ndi.video/all/developing-with-ndi/sdk/ndi-recv-receiver-failsafe)
- [Electron `app` lifecycle events (official docs)](https://www.electronjs.org/docs/latest/api/app)
- [Node.js process events/signals (official docs)](https://nodejs.org/docs/latest/api/process.html)

## Applied design decisions

- Main-process NDI service now supports concurrent `audience` and `stage` outputs.
- Frame dispatch uses a bounded latest-frame queue to avoid unbounded pending-frame growth.
- Native sender lifecycle is dimension-aware and reinitializes safely when frame size changes.
- Reliability mode prioritizes continuous frame visibility over receiver-connection-based throttling.
- Black heartbeat frames are emitted at `30 FPS` after `100ms` of input silence while outputs remain enabled.
- Teardown paths are wired to Electron and process lifecycle hooks (`before-quit`, `will-quit`, `exit`, `SIGINT`, `SIGTERM`).

## Edge-case handling in current implementation

- Graceful shutdown: sends black frame per active output, destroys senders, unloads runtime.
- Runtime missing: service degrades to no-op mode and forces output state back to disabled.
- Sender failure during send: output is automatically disabled and sender is destroyed.
- Debug aggregation can be enabled with `CAST_NDI_DEBUG=1` to inspect ingress/reject/send/error counters.
- Abrupt hard kill (`SIGKILL`, power loss): no in-process cleanup hook can run; use receiver failover externally where required.
