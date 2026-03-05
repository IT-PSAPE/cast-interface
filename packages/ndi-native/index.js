'use strict';

const path = require('node:path');

try {
  module.exports = require(path.join(__dirname, 'build', 'Release', 'ndi_native.node'));
} catch (error) {
  error.message =
    `${error.message}\n` +
    '[NDI] Native addon is not built. Run: npm run build:ndi-native (from repository root).';
  throw error;
}
