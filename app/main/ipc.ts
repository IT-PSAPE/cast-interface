import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { CastRepository } from '@database/store';
import { IPC, NDI_EVENTS, type InlineWindowMenuItem } from '@core/ipc';
import type {
  DeckBundleBrokenReferenceDecision,
  ElementCreateInput,
  ElementUpdateInput,
  Id,
  MediaAsset,
  NdiDiagnostics,
  NdiOutputConfig,
  NdiOutputName,
  OverlayCreateInput,
  OverlayUpdateInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  SlideCreateInput,
  SlideNotesUpdateInput,
  SlideOrderUpdateInput
} from '@core/types';
import { getInlineWindowMenuItems, popupInlineWindowMenu } from './application-menu';
import { readDeckBundleArchive, writeDeckBundleArchive } from './deck-bundle-archive';
import { NdiService } from './ndi/ndi-service';

function safeHandle<Args extends unknown[], R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => R,
): void {
  ipcMain.handle(channel, async (event, ...args: unknown[]) => {
    try {
      return await handler(event, ...(args as Args));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[IPC ${channel}]`, message);
      throw new Error(message);
    }
  });
}

export const registerIpcHandlers = (
  repo: CastRepository,
  ndiService: NdiService,
  getMainWindow: () => BrowserWindow | null
): void => {
  function getDialogWindow(event: IpcMainInvokeEvent): BrowserWindow | null {
    return BrowserWindow.fromWebContents(event.sender) ?? getMainWindow();
  }

  function sanitizeSuggestedBundleName(name: string): string {
    const sanitized = name.trim().replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ').replace(/\s+/g, ' ');
    return sanitized || 'cast-deck';
  }

  function ensureBundleExtension(filePath: string): string {
    return filePath.endsWith('.cst') ? filePath : `${filePath}.cst`;
  }

  function showSaveDialogForEvent(event: IpcMainInvokeEvent, options: Electron.SaveDialogOptions) {
    const browserWindow = getDialogWindow(event);
    return browserWindow ? dialog.showSaveDialog(browserWindow, options) : dialog.showSaveDialog(options);
  }

  function showOpenDialogForEvent(event: IpcMainInvokeEvent, options: Electron.OpenDialogOptions) {
    const browserWindow = getDialogWindow(event);
    return browserWindow ? dialog.showOpenDialog(browserWindow, options) : dialog.showOpenDialog(options);
  }

  ndiService.onOutputStateChanged((state) => {
    getMainWindow()?.webContents.send(NDI_EVENTS.outputStateChanged, state);
  });
  ndiService.onDiagnosticsChanged((diagnostics) => {
    getMainWindow()?.webContents.send(NDI_EVENTS.diagnosticsChanged, diagnostics);
  });

  safeHandle(IPC.getInlineWindowMenuItems, (): InlineWindowMenuItem[] => getInlineWindowMenuItems());
  safeHandle(IPC.popupInlineWindowMenu, async (event, menuId: string, x: number, y: number) => {
    const browserWindow = getDialogWindow(event);
    if (!browserWindow) return;
    await popupInlineWindowMenu(menuId, browserWindow, x, y);
  });
  safeHandle(IPC.getSnapshot, () => repo.getSnapshot());
  safeHandle(IPC.chooseDeckBundleExportPath, async (event, suggestedName: string) => {
    const result = await showSaveDialogForEvent(event, {
      title: 'Export Deck Bundle',
      defaultPath: `${sanitizeSuggestedBundleName(suggestedName)}.cst`,
      filters: [{ name: 'CST Bundle', extensions: ['cst'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (result.canceled || !result.filePath) return null;
    return ensureBundleExtension(result.filePath);
  });
  safeHandle(IPC.chooseDeckBundleImportPath, async (event) => {
    const result = await showOpenDialogForEvent(event, {
      title: 'Import Deck Bundle',
      filters: [{ name: 'CST Bundle', extensions: ['cst'] }],
      properties: ['openFile'],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  safeHandle(IPC.chooseImportReplacementMediaPath, async (event) => {
    const result = await showOpenDialogForEvent(event, {
      title: 'Choose Replacement Media',
      filters: [{ name: 'Media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'mov', 'webm', 'm4v'] }],
      properties: ['openFile'],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  safeHandle(IPC.exportDeckBundle, async (_event, itemIds: Id[], filePath: string) => {
    const bundle = repo.exportDeckBundle(itemIds);
    const normalizedPath = ensureBundleExtension(filePath);
    await writeDeckBundleArchive(normalizedPath, bundle);
    return { filePath: normalizedPath, itemCount: bundle.items.length };
  });
  safeHandle(IPC.inspectImportBundle, async (_event, filePath: string) => {
    const bundle = await readDeckBundleArchive(filePath);
    return repo.inspectImportBundle(bundle);
  });
  safeHandle(IPC.finalizeImportBundle, async (_event, filePath: string, decisions: DeckBundleBrokenReferenceDecision[]) => {
    const bundle = await readDeckBundleArchive(filePath);
    return repo.finalizeImportBundle(bundle, decisions);
  });
  safeHandle(IPC.createLibrary, (_event, name: string) => repo.createLibrary(name));
  safeHandle(IPC.createPlaylist, (_event, libraryId: Id, name: string) => repo.createPlaylist(libraryId, name));
  safeHandle(IPC.createPlaylistSegment, (_event, playlistId: Id, name: string) =>
    repo.createPlaylistSegment(playlistId, name)
  );
  safeHandle(IPC.renamePlaylistSegment, (_event, id: Id, name: string) =>
    repo.renamePlaylistSegment(id, name)
  );
  safeHandle(IPC.setPlaylistSegmentColor, (_event, id: Id, colorKey: string | null) =>
    repo.setPlaylistSegmentColor(id, colorKey)
  );
  safeHandle(IPC.movePlaylist, (_event, id: Id, direction: 'up' | 'down') =>
    repo.movePlaylist(id, direction)
  );
  safeHandle(IPC.addDeckItemToSegment, (_event, segmentId: Id, itemId: Id) =>
    repo.addDeckItemToSegment(segmentId, itemId)
  );
  safeHandle(IPC.moveDeckItemToSegment, (_event, playlistId: Id, itemId: Id, segmentId: Id | null) =>
    repo.moveDeckItemToSegment(playlistId, itemId, segmentId)
  );
  safeHandle(IPC.moveDeckItem, (_event, id: Id, direction: 'up' | 'down') =>
    repo.moveDeckItem(id, direction)
  );
  safeHandle(IPC.createPresentation, (_event, title: string) => repo.createPresentation(title));
  safeHandle(IPC.createLyric, (_event, title: string) =>
    repo.createLyric(title)
  );
  safeHandle(IPC.createSlide, (_event, input: SlideCreateInput) => repo.createSlide(input));
  safeHandle(IPC.deleteSlide, (_event, slideId: Id) => repo.deleteSlide(slideId));
  safeHandle(IPC.updateSlideNotes, (_event, input: SlideNotesUpdateInput) => repo.updateSlideNotes(input));
  safeHandle(IPC.setSlideOrder, (_event, input: SlideOrderUpdateInput) => repo.setSlideOrder(input));
  safeHandle(IPC.createElement, (_event, input: ElementCreateInput) => repo.createElement(input));
  safeHandle(IPC.createElementsBatch, (_event, inputs: ElementCreateInput[]) => repo.createElementsBatch(inputs));
  safeHandle(IPC.updateElement, (_event, input: ElementUpdateInput) => repo.updateElement(input));
  safeHandle(IPC.updateElementsBatch, (_event, inputs: ElementUpdateInput[]) => repo.updateElementsBatch(inputs));
  safeHandle(IPC.deleteElement, (_event, id: Id) => repo.deleteElement(id));
  safeHandle(IPC.deleteElementsBatch, (_event, ids: Id[]) => repo.deleteElementsBatch(ids));
  safeHandle(IPC.createMediaAsset, (_event, asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) =>
    repo.createMediaAsset(asset)
  );
  safeHandle(IPC.deleteMediaAsset, (_event, id: Id) => repo.deleteMediaAsset(id));
  safeHandle(IPC.updateMediaAssetSrc, (_event, id: Id, src: string) => repo.updateMediaAssetSrc(id, src));
  safeHandle(IPC.createOverlay, (_event, overlay: OverlayCreateInput) => repo.createOverlay(overlay));
  safeHandle(IPC.updateOverlay, (_event, input: OverlayUpdateInput) => repo.updateOverlay(input));
  safeHandle(IPC.setOverlayEnabled, (_event, overlayId: Id, enabled: boolean) => repo.setOverlayEnabled(overlayId, enabled));
  safeHandle(IPC.deleteOverlay, (_event, overlayId: Id) => repo.deleteOverlay(overlayId));
  safeHandle(IPC.createTemplate, (_event, input: TemplateCreateInput) => repo.createTemplate(input));
  safeHandle(IPC.updateTemplate, (_event, input: TemplateUpdateInput) => repo.updateTemplate(input));
  safeHandle(IPC.deleteTemplate, (_event, templateId: Id) => repo.deleteTemplate(templateId));
  safeHandle(IPC.applyTemplateToDeckItem, (_event, templateId: Id, itemId: Id) =>
    repo.applyTemplateToDeckItem(templateId, itemId)
  );
  safeHandle(IPC.resetDeckItemToTemplate, (_event, itemId: Id) =>
    repo.resetDeckItemToTemplate(itemId)
  );
  safeHandle(IPC.applyTemplateToOverlay, (_event, templateId: Id, overlayId: Id) =>
    repo.applyTemplateToOverlay(templateId, overlayId)
  );
  safeHandle(IPC.renameLibrary, (_event, id: Id, name: string) => repo.renameLibrary(id, name));
  safeHandle(IPC.renamePlaylist, (_event, id: Id, name: string) => repo.renamePlaylist(id, name));
  safeHandle(IPC.renamePresentation, (_event, id: Id, title: string) => repo.renamePresentation(id, title));
  safeHandle(IPC.renameLyric, (_event, id: Id, title: string) => repo.renameLyric(id, title));
  safeHandle(IPC.deleteLibrary, (_event, id: Id) => repo.deleteLibrary(id));
  safeHandle(IPC.deletePlaylist, (_event, id: Id) => repo.deletePlaylist(id));
  safeHandle(IPC.deletePlaylistSegment, (_event, id: Id) => repo.deletePlaylistSegment(id));
  safeHandle(IPC.deletePresentation, (_event, id: Id) => repo.deletePresentation(id));
  safeHandle(IPC.deleteLyric, (_event, id: Id) => repo.deleteLyric(id));
  safeHandle(IPC.setNdiOutputEnabled, (_event, name: NdiOutputName, enabled: boolean) => {
    return ndiService.setOutputEnabled(name, enabled);
  });
  safeHandle(IPC.getNdiOutputState, () => ndiService.getOutputState());
  safeHandle(IPC.getNdiOutputConfigs, () => ndiService.getOutputConfigs());
  safeHandle(IPC.updateNdiOutputConfig, (_event, name: NdiOutputName, config: Partial<NdiOutputConfig>) => {
    return ndiService.updateOutputConfig(name, config);
  });
  safeHandle(IPC.getNdiDiagnostics, (): NdiDiagnostics => ndiService.getDiagnostics());
  ipcMain.on(IPC.sendNdiFrame, (_event, buffer: ArrayBuffer, width: number, height: number) => {
    ndiService.receiveFrame(new Uint8Array(buffer), width, height);
  });
};
