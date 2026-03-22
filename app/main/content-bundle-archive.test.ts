import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ContentBundleManifest } from '@core/types';
import { createTempUserDataPath } from '../database/store-test-support';
import { readContentBundleArchive, writeContentBundleArchive } from './content-bundle-archive';

describe('content bundle archive', () => {
  let userDataPath = '';

  afterEach(() => {
    if (userDataPath) {
      fs.rmSync(userDataPath, { recursive: true, force: true });
      userDataPath = '';
    }
  });

  it('writes and reads a single-entry bundle archive', async () => {
    userDataPath = createTempUserDataPath();
    const archivePath = path.join(userDataPath, 'content.cst');
    const manifest: ContentBundleManifest = {
      format: 'cast-content-bundle',
      version: 1,
      exportedAt: '2026-03-22T10:00:00.000Z',
      items: [],
      templates: [],
      mediaReferences: [],
    };

    await writeContentBundleArchive(archivePath, manifest);
    const restoredManifest = await readContentBundleArchive(archivePath);

    expect(restoredManifest).toEqual(manifest);
  });
});
