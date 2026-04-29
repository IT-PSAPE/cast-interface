'use strict';

const fs = require('node:fs');
const path = require('node:path');

function getAsarUnpackedPath(targetPath) {
  return targetPath.includes('.asar' + path.sep)
    ? targetPath.replace('.asar' + path.sep, '.asar.unpacked' + path.sep)
    : null;
}

function createCandidatePaths() {
  const abi = process.versions.modules;
  const platformArchDir = `${process.platform}-${process.arch}-${abi}`;
  const baseCandidates = [
    path.join(__dirname, 'build', 'Release', 'ndi_native.node'),
    path.join(__dirname, 'bin', platformArchDir, 'ndi-native.node'),
  ];

  const expanded = [];
  for (const candidate of baseCandidates) {
    expanded.push(candidate);
    const unpacked = getAsarUnpackedPath(candidate);
    if (unpacked) {
      expanded.push(unpacked);
    }
  }

  return expanded;
}

let lastError = null;
for (const candidate of createCandidatePaths()) {
  if (!fs.existsSync(candidate)) {
    continue;
  }

  try {
    const addon = require(candidate);
    if (addon && typeof addon === 'object') {
      addon.getAddonInfo = () => ({ path: candidate });
    }
    module.exports = addon;
    return;
  } catch (error) {
    lastError = error;
  }
}

const error = lastError ?? new Error('Unable to locate ndi_native.node');
error.message =
  `${error.message}\n` +
  '[NDI] Native addon is optional during install and remains disabled until you run: npm run build:ndi-native';
throw error;
