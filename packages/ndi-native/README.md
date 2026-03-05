# @cast-interface/ndi-native

Native Node-API bridge for sending RGBA frames over NDI.

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
- `sendRgbaFrame(senderName, frame, width, height, stride)`
- `destroySender(senderName?)`

Frames are accepted in RGBA and converted to BGRA before NDI send, preserving alpha.
