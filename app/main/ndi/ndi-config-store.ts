import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { NdiOutputConfigMap } from '@core/types';
import {
  createDefaultNdiOutputConfigs,
  migrateLegacyNdiOutputConfigs,
  normalizeNdiOutputConfigs,
} from '@core/ndi';

const CONFIG_FILE = 'ndi-output-config.json';
const CURRENT_CONFIG_VERSION = 2;

interface StoredNdiOutputConfigFile {
  version: number;
  outputs: NdiOutputConfigMap;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class NdiConfigStore {
  private filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), CONFIG_FILE);
  }

  load(): NdiOutputConfigMap {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      if (isRecord(parsed) && parsed.version === CURRENT_CONFIG_VERSION && 'outputs' in parsed) {
        return normalizeNdiOutputConfigs(isRecord(parsed.outputs) ? parsed.outputs as NdiOutputConfigMap : null);
      }
      return migrateLegacyNdiOutputConfigs(isRecord(parsed) ? parsed as NdiOutputConfigMap : null);
    } catch {
      return createDefaultNdiOutputConfigs();
    }
  }

  save(configs: NdiOutputConfigMap): void {
    try {
      const payload: StoredNdiOutputConfigFile = {
        version: CURRENT_CONFIG_VERSION,
        outputs: normalizeNdiOutputConfigs(configs),
      };
      fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (error) {
      console.error('[NdiConfigStore] Failed to save config:', error);
    }
  }
}
