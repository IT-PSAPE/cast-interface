import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRendererFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), relativePath);
  return readFileSync(filePath, 'utf8');
}

describe('renderer domain reorganization', () => {
  it('keeps deck-editor as the workbench mode name', () => {
    const uiTypes = readRendererFile('app/renderer/types/ui.ts');
    expect(uiTypes).toContain("'deck-editor'");
    expect(uiTypes).not.toContain("'slide-editor'");
  });

  it('uses a settings screen instead of the old modal dialog shell', () => {
    expect(existsSync(path.resolve(process.cwd(), 'app/renderer/features/settings/settings-dialog.tsx'))).toBe(false);

    const appToolbar = readRendererFile('app/renderer/features/workbench/app-toolbar.tsx');
    const appShell = readRendererFile('app/renderer/App.tsx');

    expect(appToolbar).not.toContain('SettingsDialog');
    expect(appShell).toContain('SettingsScreen');
    expect(appShell).toContain("workbenchMode === 'settings'");
  });
});
