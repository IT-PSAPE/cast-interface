import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { CastRepository } from './store';

export function createTempUserDataPath(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cast-interface-store-'));
}

export function databasePath(userDataPath: string): string {
  return path.join(userDataPath, 'cast-interface.sqlite');
}

export function closeRepository(repository: CastRepository): void {
  ((repository as unknown) as { db: Database.Database }).db.close();
}
