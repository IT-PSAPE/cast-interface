# @cast-interface/ndi-native

Native Node-API bridge for sending BGRA offscreen paint frames over NDI.

## Build

From repository root:

```bash
npm run build:ndi-native
```

## Runtime requirements

- NDI runtime/library must be installed on the host machine.
- Optional override env vars:
  - `CAST_NDI_RUNTIME_PATH`: absolute path to NDI dynamic library file.
  - `NDI_RUNTIME_DIR`: directory containing NDI dynamic library.

Typical library names searched:

- macOS: `libndi.dylib`
- Windows: `Processing.NDI.Lib.x64.dll`
- Linux: `libndi.so.6`, `libndi.so`

## API

- `initializeSender({ senderName, width, height, withAlpha })`
- `sendBgraFrame(senderName, frame, width, height, stride)`
- `getSenderConnections(senderName, timeoutMs?)`
- `destroySender(senderName?)`

Frames are accepted in BGRA bitmap order. When alpha is disabled, the bridge normalizes the fourth byte to opaque `255` before NDI send.
