import { describe, expect, it } from 'vitest';
import { createDefaultNdiOutputConfigs, migrateLegacyNdiOutputConfigs, normalizeNdiOutputConfigs } from './ndi';

describe('createDefaultNdiOutputConfigs', () => {
  it('defaults the audience output to opaque video', () => {
    expect(createDefaultNdiOutputConfigs()).toEqual({
      audience: {
        senderName: 'Lumora - Audience',
        withAlpha: false,
      },
    });
  });
});

describe('normalizeNdiOutputConfigs', () => {
  it('preserves an explicit alpha-enabled config', () => {
    expect(normalizeNdiOutputConfigs({
      audience: {
        senderName: 'Custom Audience',
        withAlpha: true,
      },
    })).toEqual({
      audience: {
        senderName: 'Custom Audience',
        withAlpha: true,
      },
    });
  });
});

describe('migrateLegacyNdiOutputConfigs', () => {
  it('keeps the sender name and resets alpha to the opaque default', () => {
    expect(migrateLegacyNdiOutputConfigs({
      audience: {
        senderName: 'Legacy Audience',
        withAlpha: true,
      },
    })).toEqual({
      audience: {
        senderName: 'Legacy Audience',
        withAlpha: false,
      },
    });
  });
});
