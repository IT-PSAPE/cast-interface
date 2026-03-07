import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { _electron as electron } from 'playwright';

const OUTPUT_DIR = path.resolve('out/playwright');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function waitForUi(page) {
  await page.getByRole('tab', { name: 'Show' }).waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(500);
}

async function seedDataIfEmpty(page) {
  const hasLibraries = await page.evaluate(async () => {
    const snapshot = await window.castApi.getSnapshot();
    return snapshot.libraries.length > 0;
  });
  if (hasLibraries) return;

  await page.evaluate(async () => {
    const librarySnapshot = await window.castApi.createLibrary('Auto Library');
    const library = librarySnapshot.libraries[librarySnapshot.libraries.length - 1];
    if (!library) return;

    const presentationSnapshot = await window.castApi.createPresentation(library.id, 'Auto Presentation');
    const bundleAfterPresentation = presentationSnapshot.bundles.find((entry) => entry.library.id === library.id);
    const presentation = bundleAfterPresentation?.presentations[bundleAfterPresentation.presentations.length - 1];
    if (!presentation) return;

    await window.castApi.createSlide({ presentationId: presentation.id });

    await window.castApi.createPlaylist(library.id, 'Auto Playlist');
    const playlistSnapshot = await window.castApi.getSnapshot();
    const bundleAfterPlaylist = playlistSnapshot.bundles.find((entry) => entry.library.id === library.id);
    const playlistId = bundleAfterPlaylist?.playlists[0]?.playlist.id;
    if (!playlistId) return;

    await window.castApi.createPlaylistSegment(playlistId, 'Auto Segment');
    const segmentSnapshot = await window.castApi.getSnapshot();
    const bundleAfterSegment = segmentSnapshot.bundles.find((entry) => entry.library.id === library.id);
    const segmentId = bundleAfterSegment?.playlists[0]?.segments[0]?.segment.id;
    if (!segmentId) return;

    await window.castApi.addPresentationToSegment(segmentId, presentation.id);
  });

  await page.reload();
  await waitForUi(page);
}

async function screenshotFull(page, name) {
  await page.screenshot({ path: path.join(OUTPUT_DIR, name), fullPage: true });
}

async function screenshotLocator(locator, name) {
  await locator.first().screenshot({ path: path.join(OUTPUT_DIR, name) });
}

async function clickTab(page, tabName) {
  await page.getByRole('tab', { name: tabName }).click();
  await page.waitForTimeout(400);
}

async function ensurePresentationSelected(page) {
  const noPresentation = page.getByText('No presentation selected');
  const noPresentationVisible = await noPresentation.first().isVisible().catch(() => false);
  if (!noPresentationVisible) return;

  const firstLibrary = page.locator('[role=\"list\"][aria-label=\"Libraries\"] [role=\"listitem\"]').first();
  const libraryVisible = await firstLibrary.isVisible().catch(() => false);
  if (libraryVisible) {
    await firstLibrary.click();
    await page.waitForTimeout(500);
  }

  const libraryPresentationSection = page
    .getByText('Library Presentations', { exact: true })
    .first()
    .locator('xpath=ancestor::section[1]');
  const firstLibraryPresentation = libraryPresentationSection
    .locator('.group.relative > button:not([aria-label^=\"Open \"])')
    .first();
  const presentationVisible = await firstLibraryPresentation.isVisible().catch(() => false);
  if (presentationVisible) {
    await firstLibraryPresentation.click();
    await page.waitForTimeout(600);
  }
}

async function tryClick(page, locator) {
  const target = locator.first();
  const visible = await target.isVisible().catch(() => false);
  if (!visible) return false;
  await target.click();
  await page.waitForTimeout(500);
  return true;
}

async function captureShowView(page) {
  await clickTab(page, 'Show');
  await ensurePresentationSelected(page);

  await screenshotFull(page, 'show-full.png');

  await screenshotLocator(page.locator('header', { hasText: 'Views' }), 'show-command-bar.png');
  await screenshotLocator(page.locator('aside', { hasText: 'Library' }), 'show-sidebar.png');
  await screenshotLocator(page.locator('main'), 'show-workspace-main.png');
  await screenshotLocator(page.locator('footer', { hasText: 'Media' }), 'show-resource-drawer-media.png');
  await screenshotLocator(page.locator('aside', { hasText: 'Clear All Layers' }), 'show-preview-rail.png');

  await clickTab(page, 'Outline view');
  await screenshotLocator(page.locator('main'), 'show-workspace-outline-mode.png');

  await clickTab(page, 'Grid view');

  await clickTab(page, 'Overlays');
  await screenshotLocator(page.locator('footer', { hasText: 'Overlays' }), 'show-resource-drawer-overlays.png');

  await clickTab(page, 'Shortcuts');
  await screenshotLocator(page.locator('footer', { hasText: 'Shortcuts' }), 'show-resource-drawer-shortcuts.png');

  await clickTab(page, 'Media');
}

async function captureEditView(page) {
  await clickTab(page, 'Edit');

  await screenshotFull(page, 'edit-full.png');

  await screenshotLocator(page.locator('aside', { hasText: 'Objects' }), 'edit-slide-list-panel.png');
  await screenshotLocator(page.locator('section', { hasText: 'Selection' }), 'edit-canvas-panel.png');
  await screenshotLocator(page.locator('aside').filter({ has: page.getByRole('tab', { name: 'Presentation' }) }), 'edit-inspector-presentation.png');

  await clickTab(page, 'Slide');
  await screenshotLocator(page.locator('aside').filter({ has: page.getByRole('tab', { name: 'Slide' }) }), 'edit-inspector-slide.png');

  const createdText = await tryClick(page, page.getByRole('button', { name: 'Add Text' }));
  if (!createdText) return;

  await tryClick(page, page.getByRole('button').filter({ hasText: 'New Text Element' }));

  const hasShapeTab = await page.getByRole('tab', { name: 'Shape' }).first().isVisible().catch(() => false);
  if (hasShapeTab) {
    await clickTab(page, 'Shape');
    await screenshotLocator(page.locator('aside').filter({ has: page.getByRole('tab', { name: 'Shape' }) }), 'edit-inspector-shape.png');
  }

  const hasTextTab = await page.getByRole('tab', { name: 'Text' }).first().isVisible().catch(() => false);
  if (hasTextTab) {
    await clickTab(page, 'Text');
    await screenshotLocator(page.locator('aside').filter({ has: page.getByRole('tab', { name: 'Text' }) }), 'edit-inspector-text.png');
  }
}

async function writeManifest() {
  const pngFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith('.png'))
    .sort();

  const lines = [
    '# UI Screenshot Manifest',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...pngFiles.map((file) => `- ${file}`),
    '',
  ];

  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.md'), lines.join('\n'), 'utf8');
}

async function main() {
  ensureDir(OUTPUT_DIR);

  const app = await electron.launch({
    executablePath: process.env.ELECTRON_BINARY ?? (await import('electron')).default,
    args: [path.resolve('out/main/index.js')],
  });

  try {
    const page = await app.firstWindow();
    await waitForUi(page);
    await seedDataIfEmpty(page);

    await captureShowView(page);
    await captureEditView(page);
    await writeManifest();
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('[capture-ui-screenshots] failed', error);
  process.exitCode = 1;
});
