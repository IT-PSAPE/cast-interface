import type { NdiOutputName } from '@core/types';

export interface NdiSenderConfig {
  senderName: string;
  width: number;
  height: number;
  withAlpha: boolean;
}

export interface NdiNativeModule {
  initializeSender: (config: NdiSenderConfig) => void;
  sendRgbaFrame: (senderName: string, buffer: Uint8Array, width: number, height: number, stride: number) => void;
  destroySender: (senderName?: string) => void;
  getSenderConnections?: (senderName: string, timeoutMs?: number) => number;
}

export interface NdiOutputDefinition {
  output: NdiOutputName;
  senderName: string;
  defaultWidth: number;
  defaultHeight: number;
  withAlpha: boolean;
}

export const NDI_OUTPUT_DEFINITIONS: Record<NdiOutputName, NdiOutputDefinition> = {
  audience: {
    output: 'audience',
    senderName: 'Cast Interface - Audience',
    defaultWidth: 1920,
    defaultHeight: 1080,
    withAlpha: true
  }
};

export const NDI_OUTPUT_ORDER: NdiOutputName[] = ['audience'];

export function defaultNdiModuleLoader(): NdiNativeModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@cast-interface/ndi-native') as NdiNativeModule;
}
