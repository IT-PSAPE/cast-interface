import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { NdiOutputConfigMap } from '@core/types';
import { createDefaultNdiOutputConfigs } from '@core/ndi';

const CONFIG_FILE = 'ndi-output-config.json';

export class NdiConfigStore {
  private filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), CONFIG_FILE);
  }

  load(): NdiOutputConfigMap {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as NdiOutputConfigMap;
    } catch {
      return createDefaultNdiOutputConfigs();
    }
  }

  save(configs: NdiOutputConfigMap): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(configs, null, 2), 'utf-8');
    } catch (error) {
      console.error('[NdiConfigStore] Failed to save config:', error);
    }
  }
}
