import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const APP_NAME = 'Recast';
const APP_ID = 'com.recast.app';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const ELECTRON_DIST_DIR = path.join(PROJECT_ROOT, 'node_modules/electron/dist');
const OVERRIDE_DIST_DIR = path.join(PROJECT_ROOT, '.electron-dev-dist');
const OVERRIDE_INFO_PLIST = path.join(OVERRIDE_DIST_DIR, 'Electron.app/Contents/Info.plist');
const OVERRIDE_VERSION_FILE = path.join(OVERRIDE_DIST_DIR, '.electron-version');

function getElectronVersion() {
  const packageJsonPath = path.join(PROJECT_ROOT, 'node_modules/electron/package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return String(packageJson.version);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function readOverrideVersion() {
  if (!fs.existsSync(OVERRIDE_VERSION_FILE)) {
    return null;
  }
  return fs.readFileSync(OVERRIDE_VERSION_FILE, 'utf8').trim();
}

function plistNeedsPatch() {
  if (!fs.existsSync(OVERRIDE_INFO_PLIST)) {
    return true;
  }

  const result = spawnSync('plutil', ['-extract', 'CFBundleDisplayName', 'raw', OVERRIDE_INFO_PLIST], {
    encoding: 'utf8',
  });

  return result.status !== 0 || result.stdout.trim() !== APP_NAME;
}

function ensureMacOverrideDist() {
  const electronVersion = getElectronVersion();
  const shouldRefresh = !fs.existsSync(OVERRIDE_INFO_PLIST) || readOverrideVersion() !== electronVersion;

  if (shouldRefresh) {
    fs.rmSync(OVERRIDE_DIST_DIR, { recursive: true, force: true });
    fs.mkdirSync(OVERRIDE_DIST_DIR, { recursive: true });
    fs.cpSync(ELECTRON_DIST_DIR, OVERRIDE_DIST_DIR, { recursive: true, force: true });
  }

  if (shouldRefresh || plistNeedsPatch()) {
    runCommand('plutil', ['-replace', 'CFBundleDisplayName', '-string', APP_NAME, OVERRIDE_INFO_PLIST]);
    runCommand('plutil', ['-replace', 'CFBundleName', '-string', APP_NAME, OVERRIDE_INFO_PLIST]);
    runCommand('plutil', ['-replace', 'CFBundleIdentifier', '-string', APP_ID, OVERRIDE_INFO_PLIST]);
  }

  fs.writeFileSync(OVERRIDE_VERSION_FILE, `${electronVersion}\n`);
}

function createDevEnvironment() {
  if (process.platform !== 'darwin') {
    return { ...process.env };
  }

  ensureMacOverrideDist();

  return {
    ...process.env,
    ELECTRON_OVERRIDE_DIST_PATH: OVERRIDE_DIST_DIR,
  };
}

function run() {
  const args = process.argv.slice(2);
  const prepareOnly = args.includes('--prepare-only');
  const forwardedArgs = args.filter((arg) => arg !== '--prepare-only');

  const env = createDevEnvironment();
  if (prepareOnly) {
    return;
  }

  const command = process.platform === 'win32' ? 'electron-vite.cmd' : 'electron-vite';
  const child = spawn(command, ['dev', ...forwardedArgs], {
    cwd: PROJECT_ROOT,
    env,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

run();
