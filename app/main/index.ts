import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CastRepository } from '@database/store';
import { registerIpcHandlers } from './ipc';
import { NdiService } from './ndi/ndiService';

protocol.registerSchemesAsPrivileged([{
  scheme: 'cast-media',
  privileges: { secure: true, supportFetchAPI: true, stream: true },
}]);

process.on('uncaughtException', (error) => {
  console.error('[Main process uncaughtException]', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main process unhandledRejection]', reason);
});

let mainWindow: BrowserWindow | null = null;
const repository = new CastRepository();
const ndiService = new NdiService();

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1680,
    height: 980,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

app.whenReady().then(() => {
  protocol.handle('cast-media', (request) => {
    const filePath = decodeURIComponent(request.url.slice('cast-media://'.length));
    return net.fetch(pathToFileURL(filePath).toString());
  });

  registerIpcHandlers(repository, ndiService, () => mainWindow);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  ndiService.destroy();
  if (process.platform !== 'darwin') app.quit();
});
