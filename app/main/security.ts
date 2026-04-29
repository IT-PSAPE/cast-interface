import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BrowserWindow, net, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { resolveLocalMediaSourcePath } from '@database/media-source-utils';

const DEV_ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

type IpcEvent = IpcMainEvent | IpcMainInvokeEvent;
type CastMediaRequest = Pick<Request, 'method' | 'referrer' | 'url'> & {
  headers: Headers | Record<string, string>;
};

function matchesPackagedRendererPath(targetPath: string): boolean {
  const normalizedPath = path.normalize(targetPath);
  return normalizedPath.endsWith(path.normalize('/renderer/index.html'));
}

function isTrustedAppUrl(value: string): boolean {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'file:') {
      return matchesPackagedRendererPath(fileURLToPath(parsed));
    }

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return DEV_ALLOWED_HOSTS.has(parsed.hostname);
    }
  } catch {
    return false;
  }

  return false;
}

export function isTrustedWebContentsUrl(value: string): boolean {
  return isTrustedAppUrl(value);
}

export function assertTrustedIpcSender(event: IpcEvent): void {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow || senderWindow.isDestroyed()) {
    throw new Error('IPC sender is not attached to an application window');
  }

  const topLevelUrl = event.sender.getURL();
  if (!isTrustedAppUrl(topLevelUrl)) {
    throw new Error(`Untrusted IPC sender URL: ${topLevelUrl || '<empty>'}`);
  }

  const frameUrl = event.senderFrame?.url;
  if (frameUrl && !isTrustedAppUrl(frameUrl)) {
    throw new Error(`Untrusted IPC frame URL: ${frameUrl}`);
  }
}

function extractTrustedReferrer(request: CastMediaRequest): string {
  const headerValue = request.headers instanceof Headers
    ? request.headers.get('referer')
    : request.headers.referer ?? request.headers.Referer;
  const candidate = typeof headerValue === 'string' && headerValue
    ? headerValue
    : request.referrer;
  return candidate ?? '';
}

export function resolveTrustedCastMediaRequest(request: CastMediaRequest): string | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null;
  }

  // Chromium strips Referer for cross-scheme fetches by default (e.g. file:// →
  // cast-media://), so a missing referrer is normal in packaged builds. Only
  // reject when a referrer IS present and points somewhere we don't trust —
  // the privileged scheme registration already prevents external contexts
  // from issuing cast-media:// requests.
  const referrer = extractTrustedReferrer(request);
  if (referrer && !isTrustedAppUrl(referrer)) {
    return null;
  }

  const source = request.url;
  if (!source.startsWith('cast-media://')) {
    return null;
  }

  const filePath = resolveLocalMediaSourcePath(source);
  if (!filePath) {
    return null;
  }

  const normalizedPath = path.normalize(path.resolve(filePath));
  if (!path.isAbsolute(normalizedPath)) {
    return null;
  }

  return normalizedPath;
}

export function createForbiddenResponse(message = 'Forbidden'): Response {
  return new Response(message, {
    status: 403,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function createNotFoundResponse(message = 'Not found'): Response {
  return new Response(message, {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function fetchLocalFileResponse(filePath: string): Promise<Response> {
  return net.fetch(pathToFileURL(filePath).toString());
}
