#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

function getRollupVersion() {
  const rollupPackageJsonPath = path.join(process.cwd(), 'node_modules', 'rollup', 'package.json');
  if (!existsSync(rollupPackageJsonPath)) {
    throw new Error('rollup is not installed. Run npm ci before ensure-rollup-native.');
  }

  const rollupPackageJson = JSON.parse(readFileSync(rollupPackageJsonPath, 'utf8'));
  return rollupPackageJson.version;
}

function isMusl() {
  const report = typeof process.report?.getReport === 'function'
    ? process.report.getReport()
    : null;

  return !report?.header?.glibcVersionRuntime;
}

function getPlatformPackageName() {
  const { platform, arch } = process;

  if (platform === 'darwin') {
    if (arch === 'arm64') return '@rollup/rollup-darwin-arm64';
    if (arch === 'x64') return '@rollup/rollup-darwin-x64';
    return null;
  }

  if (platform === 'linux') {
    if (arch === 'x64') return isMusl() ? '@rollup/rollup-linux-x64-musl' : '@rollup/rollup-linux-x64-gnu';
    if (arch === 'arm64') return isMusl() ? '@rollup/rollup-linux-arm64-musl' : '@rollup/rollup-linux-arm64-gnu';
    if (arch === 'arm') return isMusl() ? '@rollup/rollup-linux-arm-musleabihf' : '@rollup/rollup-linux-arm-gnueabihf';
    return null;
  }

  if (platform === 'win32') {
    if (arch === 'x64') return '@rollup/rollup-win32-x64-msvc';
    if (arch === 'arm64') return '@rollup/rollup-win32-arm64-msvc';
    if (arch === 'ia32') return '@rollup/rollup-win32-ia32-msvc';
    return null;
  }

  return null;
}

function ensureRollupNative() {
  const packageName = getPlatformPackageName();
  if (!packageName) {
    console.warn(`[ensure-rollup-native] No platform package mapping for ${process.platform}/${process.arch}; skipping.`);
    return;
  }

  try {
    require.resolve(packageName);
    console.log(`[ensure-rollup-native] Found ${packageName}.`);
    return;
  } catch {
    const version = getRollupVersion();
    console.log(`[ensure-rollup-native] Missing ${packageName}; installing ${packageName}@${version}.`);
    execFileSync('npm', ['install', '--no-save', `${packageName}@${version}`], {
      stdio: 'inherit',
    });
  }
}

ensureRollupNative();
