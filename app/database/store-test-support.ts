import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CastRepository } from './store';
import type { SqliteDatabase } from './sqlite';

export function createTempUserDataPath(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'recast-store-'));
}

export function databasePath(userDataPath: string): string {
  return path.join(userDataPath, 'recast.sqlite');
}

export function closeRepository(repository: CastRepository): void {
  ((repository as unknown) as { db: SqliteDatabase }).db.close();
}
