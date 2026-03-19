import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const target = process.argv[2] ?? 'electron';
const betterSqliteBuildPath = path.join(projectRoot, 'node_modules', 'better-sqlite3', 'build');

function runRebuild(env = process.env) {
  mkdirSync(path.join(betterSqliteBuildPath, 'node_gyp_bins'), { recursive: true });

  const result = spawnSync(npmCommand, ['rebuild', 'better-sqlite3'], {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

if (target === 'node') {
  runRebuild();
}

if (target === 'electron') {
  const electronPackagePath = path.join(projectRoot, 'node_modules', 'electron', 'package.json');
  const electronPackage = JSON.parse(readFileSync(electronPackagePath, 'utf8'));

  runRebuild({
    ...process.env,
    npm_config_runtime: 'electron',
    npm_config_target: electronPackage.version,
    npm_config_disturl: 'https://electronjs.org/headers',
    npm_config_build_from_source: 'true',
  });
}

console.error(`Unknown rebuild target: ${target}`);
process.exit(1);
