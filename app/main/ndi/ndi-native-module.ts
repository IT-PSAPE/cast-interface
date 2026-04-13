export interface NdiSenderConfig {
  senderName: string;
  width: number;
  height: number;
  withAlpha: boolean;
}

export interface NdiRuntimeInfo {
  loaded: boolean;
  path: string | null;
}

export interface NdiNativeModule {
  initializeSender: (config: NdiSenderConfig) => void;
  sendRgbaFrame: (senderName: string, buffer: Uint8Array, width: number, height: number) => void;
  destroySender: (senderName?: string) => void;
  getRuntimeInfo?: () => NdiRuntimeInfo;
}

export function defaultNdiModuleLoader(): NdiNativeModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@lumora/ndi-native') as NdiNativeModule;
}
