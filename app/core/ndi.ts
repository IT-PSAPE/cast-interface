import type { NdiOutputConfig, NdiOutputConfigMap, NdiOutputName } from './types';

export const NDI_OUTPUT_WIDTH = 1920;
export const NDI_OUTPUT_HEIGHT = 1080;

export interface NdiOutputDefinition extends NdiOutputConfig {
  output: NdiOutputName;
  width: number;
  height: number;
}

export const NDI_OUTPUT_DEFINITIONS: Record<NdiOutputName, NdiOutputDefinition> = {
  audience: {
    output: 'audience',
    senderName: 'Cast Interface - Audience',
    width: NDI_OUTPUT_WIDTH,
    height: NDI_OUTPUT_HEIGHT,
    withAlpha: true,
  },
};

export const NDI_OUTPUT_ORDER: NdiOutputName[] = ['audience'];

export function createDefaultNdiOutputConfigs(): NdiOutputConfigMap {
  return {
    audience: {
      senderName: NDI_OUTPUT_DEFINITIONS.audience.senderName,
      withAlpha: NDI_OUTPUT_DEFINITIONS.audience.withAlpha,
    },
  };
}
