import { app, BrowserWindow, MessageChannelMain, protocol, net } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { NDI_EVENTS } from '@core/ipc';
import { CastRepository } from '@database/store';
import { registerIpcHandlers } from './ipc';
import { NdiService } from './ndi/ndi-service';

protocol.registerSchemesAsPrivileged([{
  scheme: 'cast-media',
  privileges: { secure: true, supportFetchAPI: true, stream: true },
}]);

interface CliOptions {
  rendererView: 'app' | 'ui-spec';
  userDataDir: string | null;
}

const cliOptions = resolveCliOptions(process.argv);
if (cliOptions.userDataDir) {
  app.setPath('userData', path.resolve(cliOptions.userDataDir));
}

let mainWindow: BrowserWindow | null = null;
const repository = new CastRepository();
const ndiService = new NdiService();

function teardownNdi(reason: string, error?: unknown) {
  if (error !== undefined) {
    console.error(`[Main process ${reason}]`, error);
  }
  try {
    ndiService.destroy();
  } catch (destroyError) {
    console.error('[Main process NDI teardown failure]', destroyError);
  }
}

process.on('uncaughtException', (error) => {
  teardownNdi('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  teardownNdi('unhandledRejection', reason);
});

process.on('exit', () => {
  teardownNdi('exit');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    teardownNdi(signal);
    app.quit();
  });
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1680,
    height: 980,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    const targetUrl = new URL(process.env.ELECTRON_RENDERER_URL);
    if (cliOptions.rendererView === 'ui-spec') {
      targetUrl.searchParams.set('view', 'ui-spec');
    }
    void mainWindow.loadURL(targetUrl.toString());
  } else {
    const rendererFile = path.join(__dirname, '../renderer/index.html');
    if (cliOptions.rendererView === 'ui-spec') {
      void mainWindow.loadFile(rendererFile, { query: { view: 'ui-spec' } });
    } else {
      void mainWindow.loadFile(rendererFile);
    }
  }
};

app.whenReady().then(() => {
  protocol.handle('cast-media', (request) => {
    const filePath = decodeURIComponent(request.url.slice('cast-media://'.length));
    return net.fetch(pathToFileURL(filePath).toString());
  });

  registerIpcHandlers(repository, ndiService, () => mainWindow);
  createWindow();
  setupNdiFramePort();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  teardownNdi('window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  teardownNdi('before-quit');
});

app.on('will-quit', () => {
  teardownNdi('will-quit');
});

function setupNdiFramePort(): void {
  if (!mainWindow) return;

  function createAndSendPort(): void {
    if (!mainWindow) return;
    const { port1, port2 } = new MessageChannelMain();
    port1.on('message', (event) => {
      const { width, height, rgba, timestamp } = event.data as {
        width: number;
        height: number;
        rgba: ArrayBuffer;
        timestamp: number;
      };
      ndiService.sendFrame({ width, height, rgba: new Uint8ClampedArray(rgba), timestamp });
    });
    port1.start();
    mainWindow.webContents.postMessage(NDI_EVENTS.framePort, null, [port2]);
  }

  mainWindow.webContents.on('did-finish-load', createAndSendPort);
}

function resolveCliOptions(argv: string[]): CliOptions {
  let rendererView: CliOptions['rendererView'] = 'app';
  let userDataDir: string | null = null;

  for (const arg of argv.slice(2)) {
    if (arg === '--ui-spec') {
      rendererView = 'ui-spec';
      continue;
    }

    if (arg.startsWith('--user-data-dir=')) {
      const value = arg.slice('--user-data-dir='.length).trim();
      userDataDir = value ? value : null;
    }
  }

  return { rendererView, userDataDir };
}
