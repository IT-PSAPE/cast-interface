import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const nodeCommand = process.execPath;

function runNodeScript(scriptPath, args = []) {
  const result = spawnSync(nodeCommand, [scriptPath, ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

function runVitest(vitestArgs) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['exec', '--', 'vitest', ...vitestArgs], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

const rebuildScriptPath = path.join(scriptDir, 'rebuild-better-sqlite3.mjs');
const vitestArgs = process.argv.slice(2);
const args = vitestArgs.length > 0 ? vitestArgs : ['run'];

const nodeRebuildStatus = runNodeScript(rebuildScriptPath, ['node']);
if (nodeRebuildStatus !== 0) {
  process.exit(nodeRebuildStatus);
}

let vitestStatus = 1;
let electronRebuildStatus = 0;

try {
  vitestStatus = runVitest(args);
} finally {
  electronRebuildStatus = runNodeScript(rebuildScriptPath, ['electron']);
}

process.exit(vitestStatus !== 0 ? vitestStatus : electronRebuildStatus);
