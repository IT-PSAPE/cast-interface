import type { NdiOutputConfig, NdiOutputConfigMap, NdiOutputName } from './types';

export const NDI_OUTPUT_WIDTH = 1920;
export const NDI_OUTPUT_HEIGHT = 1080;
type PartialNdiOutputConfigMap = Partial<Record<NdiOutputName, Partial<NdiOutputConfig>>>;

export interface NdiOutputDefinition extends NdiOutputConfig {
  output: NdiOutputName;
  width: number;
  height: number;
}

export const NDI_OUTPUT_DEFINITIONS: Record<NdiOutputName, NdiOutputDefinition> = {
  audience: {
    output: 'audience',
    senderName: 'Lumora - Audience',
    width: NDI_OUTPUT_WIDTH,
    height: NDI_OUTPUT_HEIGHT,
    withAlpha: false,
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

export function normalizeNdiOutputConfigs(configs?: PartialNdiOutputConfigMap | null): NdiOutputConfigMap {
  const defaults = createDefaultNdiOutputConfigs();
  const audience = configs?.audience;
  const senderName = typeof audience?.senderName === 'string' && audience.senderName.trim()
    ? audience.senderName.trim()
    : defaults.audience.senderName;
  const withAlpha = typeof audience?.withAlpha === 'boolean'
    ? audience.withAlpha
    : defaults.audience.withAlpha;

  return {
    audience: {
      senderName,
      withAlpha,
    },
  };
}

export function migrateLegacyNdiOutputConfigs(configs?: PartialNdiOutputConfigMap | null): NdiOutputConfigMap {
  const normalized = normalizeNdiOutputConfigs(configs);
  return {
    audience: {
      senderName: normalized.audience.senderName,
      withAlpha: NDI_OUTPUT_DEFINITIONS.audience.withAlpha,
    },
  };
}
