#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

function getInstalledPackageVersion(packageName) {
  const packageJsonPath = path.join(process.cwd(), 'node_modules', ...packageName.split('/'), 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error(`${packageName} is not installed. Run npm ci before ensure-rollup-native.`);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function isMusl() {
  const report = typeof process.report?.getReport === 'function'
    ? process.report.getReport()
    : null;

  return !report?.header?.glibcVersionRuntime;
}

function getRollupPlatformPackageName() {
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

function getLightningCssPlatformPackageName() {
  const { platform, arch } = process;

  if (platform === 'darwin') {
    if (arch === 'arm64') return 'lightningcss-darwin-arm64';
    if (arch === 'x64') return 'lightningcss-darwin-x64';
    return null;
  }

  if (platform === 'linux') {
    if (arch === 'x64') return isMusl() ? 'lightningcss-linux-x64-musl' : 'lightningcss-linux-x64-gnu';
    if (arch === 'arm64') return isMusl() ? 'lightningcss-linux-arm64-musl' : 'lightningcss-linux-arm64-gnu';
    if (arch === 'arm') return 'lightningcss-linux-arm-gnueabihf';
    return null;
  }

  if (platform === 'win32') {
    if (arch === 'x64') return 'lightningcss-win32-x64-msvc';
    if (arch === 'arm64') return 'lightningcss-win32-arm64-msvc';
    return null;
  }

  return null;
}

function ensureNativePackage({
  dependencyName,
  packageName,
}) {
  if (!packageName) {
    console.warn(`[ensure-rollup-native] No platform package mapping for ${dependencyName} on ${process.platform}/${process.arch}; skipping.`);
    return;
  }

  try {
    require.resolve(packageName);
    console.log(`[ensure-rollup-native] Found ${packageName}.`);
    return;
  } catch {
    const version = getInstalledPackageVersion(dependencyName);
    console.log(`[ensure-rollup-native] Missing ${packageName}; installing ${packageName}@${version}.`);
    execFileSync('npm', ['install', '--no-save', `${packageName}@${version}`], {
      stdio: 'inherit',
    });
  }
}

ensureNativePackage({
  dependencyName: 'rollup',
  packageName: getRollupPlatformPackageName(),
});

ensureNativePackage({
  dependencyName: 'lightningcss',
  packageName: getLightningCssPlatformPackageName(),
});
